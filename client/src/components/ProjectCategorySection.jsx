import { motion } from 'framer-motion';

const ProjectCategorySection = ({ onCategorySelect, selectedCategory }) => {
  const categories = [
    { id: 'all', name: 'All Projects', icon: '📋', count: 0 },
    { id: 'web-development', name: 'Web Development', icon: '🌐', count: 0 },
    { id: 'mobile-app', name: 'Mobile App', icon: '📱', count: 0 },
    { id: 'ai-ml', name: 'AI/ML', icon: '🤖', count: 0 },
    { id: 'blockchain', name: 'Blockchain', icon: '⛓️', count: 0 },
    { id: 'iot', name: 'IoT', icon: '🔗', count: 0 },
    { id: 'game-dev', name: 'Game Development', icon: '🎮', count: 0 },
    { id: 'data-science', name: 'Data Science', icon: '📊', count: 0 },
    { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒', count: 0 },
    { id: 'devops', name: 'DevOps', icon: '⚙️', count: 0 }
  ];

  const handleCategoryClick = (categoryId) => {
    onCategorySelect(categoryId);
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl p-4 lg:p-6 border border-[#00A8E8]/20 shadow-lg">
      <h3 className="text-lg font-bold text-[#00A8E8] mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Project Categories
      </h3>
      
      {/* Vertical grid layout for better organization */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`flex flex-col items-center gap-2 px-3 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg shadow-[#00A8E8]/25'
                : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333] hover:text-white border border-[#444] hover:border-[#00A8E8]/30'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">{category.icon}</span>
            <span className="text-xs text-center leading-tight">{category.name}</span>
            {category.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedCategory === category.id
                  ? 'bg-white/20 text-white'
                  : 'bg-[#00A8E8]/20 text-[#00A8E8]'
              }`}>
                {category.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ProjectCategorySection;
