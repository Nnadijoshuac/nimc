import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Type,
  Eye,
  RotateCcw,
  Check,
  HelpCircle,
  Accessibility as AccessibilityIcon,
} from "lucide-react";
import { AccessibilitySettings } from "../types";

interface AccessibilityToolbarProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  currentPageTitle: string;
  currentPageSummary: string;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  settings,
  onUpdateSettings,
  currentPageTitle,
  currentPageSummary,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Text-to-speech voice assistant
  const handleToggleAudio = () => {
    if ("speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        window.speechSynthesis.cancel();
        const textToRead = `${currentPageTitle}. ${currentPageSummary}. For assistance, call our Atlanta office at 404 563 1228.`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 0.95; // comfortable rate
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const handleReset = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    onUpdateSettings({
      fontScale: "normal",
      highContrast: false,
      reducedMotion: false,
    });
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Button with Depth */}
      <button
        id="accessibility-options-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open accessibility settings and audio reader"
        aria-expanded={isOpen}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold border ${
          settings.highContrast ||
          settings.fontScale !== "normal" ||
          isPlayingAudio
            ? "bg-emerald-50 text-emerald-950 border-emerald-300"
            : "bg-white hover:bg-[#f5f5f7] text-stone-700 border-[#e5e5ea] hover:border-[#c7c7cc]"
        } focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-1`}
      >
        <AccessibilityIcon className="w-3.5 h-3.5 text-stone-600" />
        {(settings.fontScale !== "normal" ||
          settings.highContrast ||
          isPlayingAudio) && (
          <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-emerald-600" />
        )}
      </button>

      {/* Accessibility Panel Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            id="accessibility-dialog"
            role="dialog"
            aria-label="Accessibility controls"
            className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-[#e5e5ea] bg-white/95 p-4 text-stone-900 shadow-xl backdrop-blur-xl sm:w-88"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <AccessibilityIcon className="w-4 h-4 text-emerald-700" />
                <h3 className="font-semibold text-sm text-stone-900">
                  Accessibility Preferences
                </h3>
              </div>
              <button
                onClick={handleReset}
                className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 hover:underline cursor-pointer"
                title="Reset all settings to default"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="space-y-4 py-3 text-xs">
              {/* Text Size Scale */}
              <div>
                <label className="flex items-center justify-between font-medium text-stone-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-stone-500" />
                    Text Size
                  </span>
                  <span className="text-[11px] text-stone-500 capitalize">
                    {settings.fontScale}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ fontScale: "normal" })}
                    className={`py-2 px-2 text-center rounded-lg border font-medium transition-all ${
                      settings.fontScale === "normal"
                        ? "bg-[#075f3c] text-white border-[#075f3c]"
                        : "bg-[#f5f5f7] text-stone-700 border-[#e5e5ea] hover:bg-[#e8e8ed]"
                    }`}
                  >
                    100% Default
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ fontScale: "large" })}
                    className={`py-2 px-2 text-center rounded-lg border font-medium transition-all ${
                      settings.fontScale === "large"
                        ? "bg-[#075f3c] text-white border-[#075f3c]"
                        : "bg-[#f5f5f7] text-stone-700 border-[#e5e5ea] hover:bg-[#e8e8ed]"
                    }`}
                  >
                    112% Large
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ fontScale: "xlarge" })}
                    className={`py-2 px-2 text-center rounded-lg border font-medium transition-all ${
                      settings.fontScale === "xlarge"
                        ? "bg-[#075f3c] text-white border-[#075f3c]"
                        : "bg-[#f5f5f7] text-stone-700 border-[#e5e5ea] hover:bg-[#e8e8ed]"
                    }`}
                  >
                    125% X-Large
                  </button>
                </div>
              </div>

              {/* High Contrast Mode */}
              <div className="flex items-center justify-between rounded-lg bg-[#f5f5f7] p-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-stone-600" />
                  <div>
                    <p className="font-medium text-stone-800">
                      High Contrast Mode
                    </p>
                    <p className="text-[10px] text-stone-500">
                      Increases borders and text distinction
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({ highContrast: !settings.highContrast })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-hidden focus:ring-2 focus:ring-emerald-600 ${
                    settings.highContrast ? "bg-emerald-600" : "bg-stone-300"
                  }`}
                  role="switch"
                  aria-checked={settings.highContrast}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.highContrast ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Screen Read Aloud Voice Guidance */}
              <div className="flex items-center justify-between rounded-lg bg-[#f5f5f7] p-2.5">
                <div className="flex items-center gap-2">
                  {isPlayingAudio ? (
                    <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-stone-500" />
                  )}
                  <div>
                    <p className="font-medium text-stone-800">
                      Audio Page Assistant
                    </p>
                    <p className="text-[10px] text-stone-500">
                      {isPlayingAudio
                        ? "Speaking current section..."
                        : "Read page overview aloud"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleAudio}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isPlayingAudio
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-emerald-700 text-white hover:bg-emerald-800"
                  }`}
                >
                  {isPlayingAudio ? "Stop" : "Listen"}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> WCAG 2.1 AA
                Compliant
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="font-medium text-stone-800 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
