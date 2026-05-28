import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazily initialize Gemini to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: AI Diary Healing feedback with Structured JSON schema
app.post("/api/gemini/diary-analysis", async (req, res) => {
  const { content, mood } = req.body;
  if (!content) {
    return res.status(400).json({ error: "日记内容不能为空" });
  }

  const client = getGeminiClient();

  if (!client) {
    // Elegant warm mock fallback if no API key is set
    const fallbackComforts = [
      "看到你的记录，我能感受到你此刻的心境。请静静闭上眼，深呼吸，允许自己在这个安全的空间里卸下所有重担，回归心灵的宁静。",
      "生活总有风雨，日记是心灵的避风港。现在的你最需要的是一次深度的放松。不妨试着在温和的声音中慢慢呼气、吸气，安享当下的清静。",
      "感谢你信任地倾吐出这些感受。疗愈的过程是缓慢而美妙的，如同水流轻抚磬钵，悠远而温厚。愿此时的琴音能伴随着你安稳入眠。"
    ];
    const comfort = fallbackComforts[Math.floor(Math.random() * fallbackComforts.length)];
    
    // Fallback formula configuration
    return res.json({
      feedback: comfort + " (💡系统提示：检测到尚未配置实际 GEMINI_API_KEY。此为精选预置疗愈回应，添加密钥后可激活定制化AI心灵导师分析！)",
      suggestedRecipeName: mood === "焦虑" || mood === "疲惫" ? "松林听雨" : "寂夜篝火",
      suggestedInstrument: "bowl",
      suggestedPurpose: mood === "焦虑" ? "rest" : "sleep",
      suggestedNoises: [
        { id: "rain", volume: 60 },
        { id: "wind", volume: 40 }
      ]
    });
  }

  try {
    const prompt = `你是一位顶级音乐心理疗愈师。用户写下了一篇心情日记。
日记内容: "${content}"
当前情绪: "${mood || '平静'}"

请结合他们的心理状态和当下的情绪，生成一份深度的关怀与疗愈回复。字数控制在150字以内，语气要温暖、宁静、空灵、极其治愈。
此外，请为他们专门定制一首大脑疗愈声波配方。
1. 建议一个极具诗意的配方名字 (比如 "晨曦山岚", "落叶微雨")。
2. 挑选一个最契合的主乐器 (可用: "harp" [竖琴/治愈轻松], "bell" [空灵星铃/专注清澈], "bowl" [西藏磬钵/深度禅修松弛], "piano" [优雅钢琴/柔和安乐])。
3. 挑选针对性的心理诉求，对应某种微澜脑波 (可用: "sleep" [睡眠/释放delta/theta], "focus" [专注/维持alpha], "rest" [静心/转换theta], "energy" [振奋/舒缓压抑])。
4. 在白噪音库中挑选出配合度最高的1-2个音效(可用: "rain" [雨声], "waves" [海浪], "wind" [微风], "campfire" [篝火])并分配一个舒适的音量比例(10-100)。`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "你是一个专门从事音乐治疗、声音愈疗与冥想的AI心灵顾问，擅长用宁静温柔的文字帮助人们安顿身心。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: {
              type: Type.STRING,
              description: "温暖、字数在150字以内的中文心灵疗愈抚慰，极其治愈、空灵。"
            },
            suggestedRecipeName: {
              type: Type.STRING,
              description: "符合今日心情、十分诗意雅致的声波配方名字。"
            },
            suggestedInstrument: {
              type: Type.STRING,
              enum: ["harp", "bell", "bowl", "piano"],
              description: "竖琴 harp, 颂钵 bowl, 磬铃 bell, 钢琴 piano"
            },
            suggestedPurpose: {
              type: Type.STRING,
              enum: ["sleep", "focus", "rest", "energy"],
              description: "脑波状态诉求：助眠 sleep, 专注 focus, 转换 rest, 舒缓 energy"
            },
            suggestedNoises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, enum: ["rain", "waves", "wind", "campfire"] },
                  volume: { type: Type.INTEGER }
                },
                required: ["id", "volume"]
              },
              description: "建议搭配的白噪音和音量值"
            }
          },
          required: ["feedback", "suggestedRecipeName", "suggestedInstrument", "suggestedPurpose", "suggestedNoises"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty gemini response text");
    }

    const jsonResponse = JSON.parse(resultText);
    res.json(jsonResponse);

  } catch (error: any) {
    console.error("Gemini processing error:", error);
    res.status(500).json({
      error: "AI 愈疗助手暂时处于冥想中，请稍后再试",
      details: error.message
    });
  }
});

// API: AI Diary Auto-continuation for smoothing and polish
app.post("/api/gemini/diary-continue", async (req, res) => {
  const { content, mood } = req.body;
  if (!content) {
    return res.status(400).json({ error: "内容不能为空" });
  }

  const client = getGeminiClient();

  if (!client) {
    const fallbackContinuations = [
      "，在这个温和的当下，试着深呼吸，将紧绷的念头转托给林间的微风与寂静松涛。",
      "，万物皆在它的节奏里，深长的每一次呼吸，都是身体与自然的和谐相调。",
      "，请允许此刻的疲惫稍作停靠。琴弦慢拨，泉水潺潺，它们会一点点荡洗你白日的杂尘。"
    ];
    const item = fallbackContinuations[Math.floor(Math.random() * fallbackContinuations.length)];
    return res.json({ continuation: item });
  }

  try {
    const prompt = `用户写了一段心灵日记草稿（情绪：${mood || '平静'}）："${content}"
请顺着用户的感悟、情绪或陈述，极其通顺、衔接自然地续写1-2句非常温暖、具有疗愈身心或中国传统哲学思想的文学级句子（续写内容在50字以内）。
请直接返回续写追加的中文词句内容，不要有任何前导词、拼音、冒号或引号。`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "你是一个善于聆听和用诗意文字修持愈疗身心的高阶导师，能够极其流畅、毫无违和感地顺延用户笔触写出抚慰心灵的续句。"
      }
    });

    const resultText = response.text || "";
    let cleanText = resultText.trim().replace(/^["“'「]/, "").replace(/["”'」]$/, "");
    res.json({ continuation: cleanText });

  } catch (error: any) {
    console.error("Gemini continue error:", error);
    res.status(500).json({
      error: "AI 续写线路稍忙",
      details: error.message
    });
  }
});

// API: AI custom floating prayer words based on theme
app.post("/api/gemini/prayer-words", async (req, res) => {
  const { theme } = req.body;
  if (!theme) {
    return res.status(400).json({ error: "主题不能为空" });
  }

  const client = getGeminiClient();

  if (!client) {
    // Beautiful default fallback words if no API key is set
    const fallbackMap: Record<string, string[]> = {
      "学业": ["学富五车", "金榜题名", "慧心凝聚", "考试顺利", "一举高中"],
      "事业": ["诸事大吉", "步步高升", "财运亨通", "得心应手", "宏图大展"],
      "健康": ["身安体健", "气色润泽", "百病不侵", "少忧无恼", "怡然自乐"],
      "情绪": ["心无挂碍", "不骄不躁", "安然如水", "拨云见日", "欢喜常在"],
      "修心": ["心若止水", "定慧双修", "自性清净", "无挂无碍", "返璞归真"],
    };

    // Find closest or default
    const matchedKey = Object.keys(fallbackMap).find(k => theme.includes(k)) || "情绪";
    const words = fallbackMap[matchedKey];
    return res.json({
      words,
      isFallback: true
    });
  }

  try {
    const prompt = `你是一位高阶禅修法师和国学文字创作者。用户希望定制电子木鱼默念祈愿的心灵词汇（敲木鱼时飘浮升起的文字）。
请为主题“${theme}”量身定制 5 个非常高雅、正向、具有深厚国学底蕴、极具疗愈抚慰力量的短词（用作敲木鱼时的默念祈愿文案，如“心无挂碍”、“喜乐安顺”等）。
每个词语必须严格是 2 到 4 个汉字。绝对不要超过 4 个汉字，不要有标点符号、数字、英文字符，也不要带任何 emoji。

请以 JSON 格式返回，格式遵循：{"words": ["词语1", "词语2", "词语3", "词语4", "词语5"]}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "你是一个专门创作空灵雅致、宁静和合的心灵祈愿短词的AI大师，句句皆具美学与抚慰意涵。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            words: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5个词语列表"
            }
          },
          required: ["words"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty gemini response");
    }

    const jsonResponse = JSON.parse(resultText);
    res.json(jsonResponse);

  } catch (error: any) {
    console.error("Gemini prayer words error:", error);
    res.status(500).json({
      error: "AI 祈愿词生成忙，请稍后重试",
      details: error.message
    });
  }
});

// Setup Vite and Static endpoints
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback handling
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
