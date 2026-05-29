import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTheme } from "vuetify";

export type TourStep = {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
  };
};

function pulseElement(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.add("tour-pulse");
  setTimeout(() => el.classList.remove("tour-pulse"), 3000);
}

export function useTour() {
  const theme = useTheme();

  function startTour(
    steps: TourStep[],
    helpBtnSelector: string,
    onDone?: () => void,
  ) {
    const isDark = theme.global.current.value.dark;
    if (isDark) document.body.classList.add("tour-dark");

    const cleanup = () => document.body.classList.remove("tour-dark");

    const d = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.75,
      stagePadding: 6,
      stageRadius: 6,
      overlayColor: "#000000",
      allowClose: false,
      allowKeyboardControl: true,
      steps: steps.map((s, i) => ({
        element: s.element,
        popover: {
          ...s.popover,
          showButtons:
            i < steps.length - 1
              ? (["previous", "next", "close"] as const)
              : (["previous", "next"] as const),
          doneBtnText: "Done",
          ...(i < steps.length - 1 ? { closeText: "Skip" } : {}),
        },
      })),
      onCloseClick: () => {
        d.destroy();
        cleanup();
        pulseElement(helpBtnSelector);
        onDone?.();
      },
      onNextClick: (_el, _step, _opts) => {
        if (d.isLastStep()) {
          d.destroy();
          cleanup();
          onDone?.();
        } else {
          d.moveNext();
        }
      },
    });
    d.drive();
    return d;
  }

  return { startTour };
}
