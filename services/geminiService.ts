import { GoogleGenAI } from "@google/genai";
import { GameState } from "../types";
import { CAREER_LADDER } from "../constants";
import { formatMoney } from "../utils/format";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getOracleAdvice = async (state: GameState): Promise<string> => {
  const currentJob = CAREER_LADDER.find(j => j.id === state.currentJobId);
  
  // Determine team status from existing GameState properties (hasBusiness)
  // 'teamMode' does not exist in the GameState interface.
  const teamStatus = state.hasBusiness ? "Владелец тимы (получает %)" : "Нет (работает сам)";

  const prompt = `
    Ты циничный, опытный наставник в игре про мошенников "ScamTycoon". 
    Игрок занимается темками (крипта, эскорт, дейтинг).
    
    Статистика игрока:
    - Баланс: ${formatMoney(state.balance)}
    - Должность: ${currentJob?.title || 'Безработный'} в сфере ${currentJob?.vertical || 'Нигде'}
    - Доход в сек: ${formatMoney(state.profitPerSecond)}
    - Репутация: ${state.reputation}
    - В тиме: ${teamStatus}

    Дай короткий, дерзкий совет (1-2 предложения) на русском языке с использованием сленга (ворк, мамонты, профит, темка).
    Если он бедный, скажи тапать больше.
    Если богатый, скажи расширять офис.
    Будь веселым и немного грубым.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Работай, мамонт не вымрет.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Связь прервалась. Менты глушат сигнал.";
  }
};