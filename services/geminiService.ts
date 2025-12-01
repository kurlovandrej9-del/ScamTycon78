import { GameState } from "../types";

// Service Disabled for Static Deployment
export const getOracleAdvice = async (state: GameState): Promise<string> => {
  return "Сервис временно недоступен.";
};