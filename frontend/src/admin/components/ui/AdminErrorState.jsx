function AdminErrorState({ message = "Something went wrong." }) {
  return (
    <div className="border border-red-700/25 bg-red-50 p-4 text-sm font-bold text-red-800">
      {message}
    </div>
  );
}

export default AdminErrorState;
