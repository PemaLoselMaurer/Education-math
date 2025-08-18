"use client";
import React from "react";
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [age, setAge] = React.useState<number | "">("");
  const [favouriteSubjects, setFavouriteSubjects] = React.useState<string>("");
  const [hobbies, setHobbies] = React.useState<string>("");
  const [message, setMessage] = React.useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://localhost:3001/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          age: age === "" ? undefined : Number(age),
          favouriteSubjects: favouriteSubjects.split(",").map(s => s.trim()).filter(Boolean),
          hobbies: hobbies.split(",").map(h => h.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Preferences saved successfully!");
        setTimeout(() => router.push("/"), 1500);
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setMessage("Network error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{
      backgroundImage: 'url(/stars.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <Card className="w-full max-w-md mx-auto">
        <CardContent>
          <CardTitle className="text-3xl font-bold mb-6 text-center text-blue-700">Welcome!</CardTitle>
          <p className="text-lg text-center mb-6 text-gray-700">You have successfully registered. Fill up the details below to complete your profile.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-medium mb-1 text-gray-700">First Name</label>
              <Input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="First Name" />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Last Name</label>
              <Input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Last Name" />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Age</label>
              <Input type="number" min={1} value={age} onChange={e => setAge(e.target.value === "" ? "" : Number(e.target.value))} required placeholder="Age" />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Favourite Subjects (comma separated)</label>
              <Input type="text" value={favouriteSubjects} onChange={e => setFavouriteSubjects(e.target.value)} required placeholder="Math, Science, English" />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700">Hobbies (comma separated)</label>
              <Input type="text" value={hobbies} onChange={e => setHobbies(e.target.value)} required placeholder="Reading, Painting, Football" />
            </div>
            <Button type="submit" className="w-full" variant="default" size="default">
              Save Preferences
            </Button>
            {message && <p className="text-red-500 mt-2 font-medium text-center">{message}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
