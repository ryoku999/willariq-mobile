import type { ComponentType, ReactElement } from "react";
import { useCssElement } from "react-native-css";
import {
  KeyboardAwareScrollView as NativeKeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps as NativeKeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

type KeyboardAwareScrollViewProps = NativeKeyboardAwareScrollViewProps & {
  className?: string;
  contentContainerClassName?: string;
};

function KeyboardAwareScrollViewBase(props: KeyboardAwareScrollViewProps) {
  return <NativeKeyboardAwareScrollView {...props} />;
}

const useKeyboardCssElement = useCssElement as (
  component: ComponentType<KeyboardAwareScrollViewProps>,
  props: KeyboardAwareScrollViewProps,
  mapping: Record<string, string>,
) => ReactElement;

export function KeyboardAwareScrollView(props: KeyboardAwareScrollViewProps) {
  return useKeyboardCssElement(KeyboardAwareScrollViewBase, props, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
}
