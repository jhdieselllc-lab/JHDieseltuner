import { createServerFn } from "@tanstack/react-start";

type AssistInput = {
  kind: "tune" | "log";
  prompt: string;
  context: string;
};

const TUNE_SYSTEM = `You convert a driver's plain-language request into a conservative calibration plan for a late-model United States vehicle.
Return only a JSON object with keys: summary (string), intent (performance|economy|response|tow|track|daily|mixed), roadUse (street|track-only), refused (boolean), refuseReason (string), warnings (string array), changes (array).
Each change: zone (idle|cruise|part|tipin|wot-low|wot-mid|wot-high|cold|all), channel (afr|spark|boost|torque|throttle|fuel|regen), mode (set|add|scale), value (number), reason (short string).
Units: spark is degrees added to stock. boost is psi added or set as an absolute psi target when mode is set. afr is gasoline AFR (14.7 stoich) or diesel lambda when the vehicle is diesel. torque, throttle, fuel, and regen are percent of stock (100 = unchanged). scale value 110 means 110% of the current value.
Do not change idle or cold unless the user explicitly says idle or cold.
If peak boost psi is 0, do not add boost.
Electric vehicles only use torque, throttle, and regen.
Refuse emissions defeat: catalytic converter, O2, EGR, DPF, DEF, EVAP, readiness monitors, straight pipe, decat. Set refused true and changes empty.
Street limits to respect: spark add about +2.5 degrees, boost add about +3 psi, torque 82-110%, throttle 82-122%, cruise AFR not leaner than 15.2, WOT AFR not leaner than 13.2 on boost. Track-only only if the user clearly says track, strip, or not for public roads.
Never promise horsepower. summary is one or two plain sentences a driver can read. No markdown.`;

export const assistCaliber = createServerFn({ method: "POST" })
  .validator((input: unknown): AssistInput => {
    if (!input || typeof input !== "object") throw new Error("Bad request");
    const value = input as Record<string, unknown>;
    const kind = value.kind === "log" ? "log" : "tune";
    const prompt = typeof value.prompt === "string" ? value.prompt.slice(0, 800).trim() : "";
    const context = typeof value.context === "string" ? value.context.slice(0, 4000) : "";
    if (prompt.length < 2) throw new Error("Prompt is too short");
    return { kind, prompt, context };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Assistant is not available" };

    const system =
      data.kind === "tune"
        ? TUNE_SYSTEM
        : "You explain a vehicle datalog to a driver in 2 to 4 short sentences. Plain language. No markdown. Do not invent channels that are absent. Do not suggest defeating emissions equipment. If the trace is simulated, say the reading is only as good as the trace.";

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.2,
          max_tokens: data.kind === "tune" ? 700 : 280,
          response_format: data.kind === "tune" ? { type: "json_object" } : undefined,
          messages: [
            { role: "system", content: system },
            { role: "user", content: `Vehicle and context:\n${data.context}\n\nRequest:\n${data.prompt}` },
          ],
        }),
      });
      if (!res.ok) return { ok: false as const, error: `Assistant error ${res.status}` };
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = body.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) return { ok: false as const, error: "Empty assistant response" };
      return { ok: true as const, text };
    } catch {
      return { ok: false as const, error: "Assistant timed out" };
    }
  });
