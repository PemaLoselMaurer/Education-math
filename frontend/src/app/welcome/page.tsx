"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WELCOME_SYSTEM_PROMPT } from "@/lib/prompt";

type ProfilePayload = {
  firstName?: string;
  lastName?: string;
  age?: number;
  favouriteSubjects?: string[];
  hobbies?: string[];
};

export default function WelcomePage() {
  const router = useRouter();
  const [me, setMe] = useState<{ userId: number; username: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<string>("");
  const [favouriteSubjects, setFavouriteSubjects] = useState<string>("");
  const [hobbies, setHobbies] = useState<string>("");

  // AI / ASR states
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${base}/user/me`, { credentials: "include" });
        if (!res.ok) throw new Error("unauthorized");
        const data = (await res.json()) as {
          userId: number;
          username: string;
        } | null;
        if (!data) throw new Error("unauthorized");
        if (alive) setMe(data);
      } catch {
        setError("Please sign in to continue.");
        router.push(`/auth?next=/welcome`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [base, router]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          await transcribeAndExtract(dataUrl);
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setError("Mic permission denied or unsupported.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);
  };

  const transcribeAndExtract = async (dataUrl: string) => {
    setTranscribing(true);
    setError(null);
    try {
      // 1) Transcribe with local ASR
      const tRes = await fetch(`${base}/ai/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ audio: dataUrl }),
      });
      const tData = (await tRes.json()) as { text?: string };
      const spoken = (tData.text || "").trim();
      if (!spoken) {
        setError("Could not transcribe speech. Try again.");
        return;
      }
      // 2) Ask AI to extract structured profile
      setAiExtracting(true);
      const extractionPrompt = [
        "Extract a concise JSON object from the following text with keys:",
        "firstName (string), lastName (string), age (number),",
        "favouriteSubjects (array of strings), hobbies (array of strings).",
        "Only output JSON with those keys. If unknown, omit the key.",
        "\nText:",
        spoken,
      ].join(" ");
      // Stream from backend AI and accumulate reply
      const res = await fetch(`${base}/ai/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        credentials: "include",
        body: JSON.stringify({
          prompt: extractionPrompt,
          system: WELCOME_SYSTEM_PROMPT,
        }),
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `AI request failed: ${res.status}`);
      }
      const reader = (
        res.body as unknown as {
          getReader: () => ReadableStreamDefaultReader<Uint8Array>;
        }
      ).getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reply = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\n\n/);
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line) continue;
          const idx = line.indexOf("data:");
          if (idx === -1) continue;
          const jsonStr = line.slice(idx + 5).trim();
          try {
            const obj = JSON.parse(jsonStr) as {
              delta?: string;
              done?: boolean;
              error?: string;
            };
            if (obj.error) throw new Error(obj.error);
            if (typeof obj.delta === "string") reply += obj.delta;
            if (obj.done) {
              buffer = "";
              break;
            }
          } catch {
            // ignore malformed partial frame
          }
        }
      }
      const parsed = safeParseJson(reply);
      if (parsed) {
        applyExtracted(parsed);
      } else {
        setError(
          "AI couldn’t extract details. You can fill the form manually."
        );
      }
    } catch {
      setError("AI/ASR request failed. Please try again.");
    } finally {
      setTranscribing(false);
      setAiExtracting(false);
    }
  };

  const safeParseJson = (text: string): ProfilePayload | null => {
    // Attempt to find a JSON block, tolerating markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = fenceMatch ? fenceMatch[1] : text;
    try {
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? (obj as ProfilePayload) : null;
    } catch {
      // Try to find a JSON object substring
      const braceStart = raw.indexOf("{");
      const braceEnd = raw.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
        try {
          const obj = JSON.parse(raw.slice(braceStart, braceEnd + 1));
          return obj && typeof obj === "object"
            ? (obj as ProfilePayload)
            : null;
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const applyExtracted = (p: ProfilePayload) => {
    if (p.firstName) setFirstName(p.firstName);
    if (p.lastName) setLastName(p.lastName);
    if (typeof p.age === "number" && Number.isFinite(p.age))
      setAge(String(p.age));
    if (Array.isArray(p.favouriteSubjects))
      setFavouriteSubjects(p.favouriteSubjects.join(", "));
    if (Array.isArray(p.hobbies)) setHobbies(p.hobbies.join(", "));
  };

  const onSave = async () => {
    setError(null);
    const payload: ProfilePayload = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      age: age.trim() ? Number(age) : undefined,
      favouriteSubjects: favouriteSubjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      hobbies: hobbies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      const res = await fetch(`${base}/user/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/");
    } catch {
      setError("Failed to save profile.");
    }
  };

  if (loading) return <div className="p-6 text-blue-500">Loading…</div>;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/stars.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card className="w-full max-w-2xl bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">
            Welcome{me ? `, ${me.username}` : ""} 👋
          </CardTitle>
          <p className="text-sm text-gray-600">
            Let’s set up your profile. You can speak and let AI fill this for
            you, or type manually.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex flex-wrap gap-2">
            {!recording ? (
              <Button
                onClick={startRecording}
                disabled={transcribing || aiExtracting}
              >
                {transcribing || aiExtracting
                  ? "Please wait…"
                  : "Use microphone"}
              </Button>
            ) : (
              <Button variant="outline" onClick={stopRecording}>
                Stop
              </Button>
            )}
            {(transcribing || aiExtracting) && (
              <span className="text-sm text-gray-600">
                {transcribing ? "Transcribing…" : "Asking AI…"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">First name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Last name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Age</label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">
                Favourite subjects (comma separated)
              </label>
              <Input
                value={favouriteSubjects}
                onChange={(e) => setFavouriteSubjects(e.target.value)}
                placeholder="e.g., Math, Science"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">
                Hobbies (comma separated)
              </label>
              <Input
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="e.g., Soccer, Drawing"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.push("/")}>
              Skip
            </Button>
            <Button onClick={onSave}>Save and continue</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
