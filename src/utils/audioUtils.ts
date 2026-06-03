import { revendaxAudio } from "../components/AudioEngine";

export const triggerAudio = (type: "click" | "success" | "goal" | "stagnation", soundEnabled = true) => {
  if (!soundEnabled) return;
  if (type === "click") revendaxAudio.playClick();
  if (type === "success") revendaxAudio.playSaleSuccess();
  if (type === "goal") revendaxAudio.playGoalReached();
  if (type === "stagnation") revendaxAudio.playStagnationAlert();
};
