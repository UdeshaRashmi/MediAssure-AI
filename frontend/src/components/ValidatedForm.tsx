import { createContext, useContext, useId, useState, type ComponentProps } from "react";
import { fieldError } from "../validation";
import { useI18n } from "../i18n";

const Validation = createContext<{ errors: Record<string, string>; id: string }>({ errors: {}, id: "" });
function errorFor(input: HTMLInputElement, form: HTMLFormElement) {
  const password = form.elements.namedItem("password");
  if (input.validity.badInput) return "Enter a valid number.";
  return fieldError({ name: input.name, value: input.value, required: input.required,
    type: input.dataset.password ? "password" : input.type, minLength: input.minLength > 0 ? input.minLength : undefined,
    maxLength: input.maxLength > 0 ? input.maxLength : undefined, min: input.min, max: input.max,
    integer: input.type === "number" && input.step !== "any",
    phone: input.type === "tel", match: input.name === "confirm_password" && password instanceof HTMLInputElement ? password.value : undefined });
}
export function ValidatedForm({ onSubmit, onChange, children, ...props }: ComponentProps<"form">) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const id = useId();
  function validate(event: Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0]) {
    event.preventDefault();
    const form = event.currentTarget;
    const next: Record<string, string> = {};
    for (const element of Array.from(form.elements)) {
      if (!(element instanceof HTMLInputElement) || !element.name || element.disabled || ["checkbox", "radio", "submit", "button"].includes(element.type)) continue;
      const message = errorFor(element, form);
      if (message) next[element.name] = message;
    }
    setErrors(next);
    if (Object.keys(next).length) {
      const first = form.elements.namedItem(Object.keys(next)[0]);
      if (first instanceof HTMLElement) first.focus();
      return;
    }
    onSubmit?.(event);
  }
  return <Validation.Provider value={{ errors, id }}><form {...props} noValidate onSubmit={validate} onChange={event => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.name) setErrors(current => {
      const next = { ...current }; delete next[input.name];
      if (input.name === "password") delete next.confirm_password;
      return next;
    });
    onChange?.(event);
  }} onBlurCapture={event => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.name && !["checkbox", "radio"].includes(input.type)) {
      const message = errorFor(input, event.currentTarget);
      setErrors(current => { const next = { ...current }; if (message) next[input.name] = message; else delete next[input.name]; return next; });
    }
  }}>{children}</form></Validation.Provider>;
}
export function ValidatedInput(props: ComponentProps<"input">) {
  const { errors, id } = useContext(Validation);
  const { t } = useI18n();
  const error = props.name ? errors[props.name] : undefined;
  const errorId = `${id}-${props.name}-error`;
  return <><input {...props} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : props["aria-describedby"]} />{error && <span id={errorId} className="mt-1 block text-sm text-red-700" role="alert">{t(error)}</span>}</>;
}
