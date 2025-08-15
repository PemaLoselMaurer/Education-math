// Simple AudioWorkletProcessor that forwards mono Float32 frames to the main thread.
// It copies channel 0 into a transferable ArrayBuffer for efficient posting.
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs && inputs[0];
    if (input && input.length > 0) {
      // Take channel 0
      const ch0 = input[0];
      // Copy into transferable
      const copy = new Float32Array(ch0.length);
      copy.set(ch0);
      this.port.postMessage(copy.buffer, [copy.buffer]);
    }
    // Keep processor alive
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);
