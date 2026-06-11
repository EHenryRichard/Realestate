import toast, { Toaster } from "react-hot-toast";

const forest = "#063f2c";
const emerald = "#0a6b4b";
const gold = "#c99a2e";
const cream = "#f7f2e7";

export const toastStyle = {
  background: gold,
  color: forest,
  border: `1px solid ${forest}`,
  borderRadius: "0",
  boxShadow: "0 18px 50px rgba(6, 63, 44, 0.24)",
  fontSize: "14px",
  fontWeight: 700,
};

export const toastOptions = {
  duration: 3600,
  style: toastStyle,
  success: {
    iconTheme: {
      primary: forest,
      secondary: gold,
    },
  },
  error: {
    iconTheme: {
      primary: forest,
      secondary: gold,
    },
  },
  loading: {
    iconTheme: {
      primary: forest,
      secondary: gold,
    },
  },
};

export function AppToaster() {
  return (
    <Toaster
      gutter={10}
      position="top-center"
      reverseOrder={false}
      toastOptions={toastOptions}
    />
  );
}

export const showSuccess = (msg) => toast.success(msg, { style: toastStyle });

export const showError = (msg) => toast.error(msg, { style: toastStyle });

export const showLoading = (msg) => toast.loading(msg, { style: toastStyle });

export const showToast = (msg) => toast(msg, { style: toastStyle });

export const showWarning = (msg) =>
  toast.custom((t) => (
    <div
      className={`w-full max-w-md border p-3 text-sm font-extrabold shadow-lg transition duration-200 ${
        t.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
      style={{
        background: gold,
        borderColor: forest,
        color: forest,
      }}
    >
      <span className="mr-2 inline-block bg-brand-gold px-2 py-1 text-xs uppercase text-brand-forest">
        Warning
      </span>
      {msg}
    </div>
  ));

export const dismissToast = (id) => toast.dismiss(id);

export const showPromise = (promiseFn, { loading, success, error }) =>
  toast.promise(
    typeof promiseFn === "function" ? promiseFn() : promiseFn,
    { loading, success, error },
    {
      style: toastStyle,
      success: {
        iconTheme: {
          primary: gold,
          secondary: forest,
        },
      },
      error: {
        iconTheme: {
          primary: forest,
          secondary: gold,
        },
      },
    },
  );

export const toastTheme = {
  cream,
  emerald,
  forest,
  gold,
};
