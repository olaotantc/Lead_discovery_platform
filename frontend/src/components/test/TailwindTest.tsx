export default function TailwindTest() {
  return (
    <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">✨ Tailwind CSS Working!</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-lg">Responsive</h3>
          <p className="text-sm opacity-90">Grid system active</p>
        </div>
        <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-lg">Gradient</h3>
          <p className="text-sm opacity-90">Background working</p>
        </div>
        <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-lg">Animations</h3>
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse mt-2"></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 bg-red-500 rounded-full text-xs">Colors</span>
        <span className="px-3 py-1 bg-green-500 rounded-full text-xs">Utilities</span>
        <span className="px-3 py-1 bg-blue-500 rounded-full text-xs">Components</span>
        <span className="px-3 py-1 bg-purple-500 rounded-full text-xs">Working!</span>
      </div>
    </div>
  );
}