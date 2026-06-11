function ErrorState({ title = "Something went wrong", message = "Please try again later." }) {
  return (
    <div className="border border-red-200 bg-red-50 p-6 text-red-900">
      <h3 className="text-lg font-black tracking-[0]">{title}</h3>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </div>
  );
}

export default ErrorState;
