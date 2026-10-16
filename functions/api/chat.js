const SYSTEM = `إنت رفيق داعم لطلاب حاسين بإحباط وضغط دراسي. اتكلم بالعربي المصري البسيط والدافي.
- اسمع الأول من غير أحكام ولا مواعظ ولا كلام محفوظ.
- ردودك قصيرة (3-5 جمل) وبسؤال واحد على الأكتر.
- اقترح خطوة صغيرة واقعية تناسب كلامه، ومتضغطش عليه يذاكر لو منهك، ساعده يقرر يستريح ولا يبدأ بحاجة بسيطة.
- متقللش من مشكلته ومتوعدش بإن كل حاجة هتبقى مثالية.
- متشخصش أمراض نفسية، وقول بوضوح إنك مش بديل عن مختص لو الموضوع محتاج.
- لو في يأس شديد أو كلام عن إيذاء النفس: خده بجدية، وشجعه يكلم شخص موثوق قريب منه أو مختص أو الطوارئ فورًا لو في خطر.`;

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) return new Response("no key", { status: 500 });
  let body;
  try { body = await request.json(); } catch { return new Response("bad", { status: 400 }); }
  const msgs = (body.messages || []).slice(-12).map(m => ({
    role: m.w === "a" ? "model" : "user",
    parts: [{ text: String(m.t || "").slice(0, 1500) }]
  }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return new Response("bad", { status: 400 });
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: msgs,
      generationConfig: { maxOutputTokens: 400, temperature: 0.8 }
    })
  });
  if (!r.ok) return new Response("upstream", { status: 502 });
  const j = await r.json();
  const reply = j.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  return Response.json({ reply });
}
