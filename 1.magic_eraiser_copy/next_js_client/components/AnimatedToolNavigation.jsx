// components/AnimatedToolNavigation.jsx
import React, { useState, useRef } from 'react';
import { cn } from '../lib/utils';
import { Eraser, Paintbrush, ImagePlus, Focus, Pipette, Palette, Droplet, CircleOff } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

const AnimatedToolNavigation = ({ editorMode, setEditorMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Define tool items with icons and labels - now with "Recolor" instead of "Art"
  const tools = [
    { id: 'normal', title: 'Magic Eraser', icon: <Eraser className="h-full w-full" />, href: '#normal' },
    { id: 'powerpaint', title: 'Inpaint', icon: <Paintbrush className="h-full w-full" />, href: '#powerpaint' },
    { id: 'outpaint', title: 'Outpaint', icon: <ImagePlus className="h-full w-full" />, href: '#outpaint' },
    { id: 'enhance', title: 'Enhance', icon: <Focus className="h-full w-full" />, href: '#enhance' },
    { id: 'colorize', title: 'Colorize', icon: <Pipette className="h-full w-full" />, href: '#colorize' },
    { id: 'art', title: 'Recolor', icon: <Palette className="h-full w-full" />, href: '#recolor' },
    { id: 'blur', title: 'Blur', icon: <Droplet className="h-full w-full" />, href: '#blur' },
    { id: 'background-removal', title: 'Remove BG', icon: <CircleOff className="h-full w-full" />, href: '#remove-bg' },
  ];

  // Handle tool selection
  const handleToolSelect = (toolId) => {
    setEditorMode(toolId);
    setMobileMenuOpen(false);
  };

  // Find the current tool label for mobile display
  const currentTool = tools.find(tool => tool.id === editorMode)?.title || 'Select Mode';

  return (
    <div className="py-3 px-4 flex justify-center">
      {/* Desktop Floating Dock */}
      <div className="hidden md:block max-w-4xl mx-auto w-full">
        <FloatingDockTools 
          tools={tools} 
          currentTool={editorMode} 
          onSelectTool={handleToolSelect}
        />
      </div>

      {/* Mobile dock-style circular buttons */}
      <div className="md:hidden flex justify-center w-full">
        <div className="flex gap-2 overflow-x-auto py-1 px-2 max-w-full">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                editorMode === tool.id
                  ? getToolColor(tool.id) + ' text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              <div className="w-5 h-5">
                {tool.icon}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Get color based on tool ID
const getToolColor = (id) => {
  switch(id) {
    case 'normal': return 'bg-blue-500';
    case 'powerpaint': return 'bg-purple-500';
    case 'outpaint': return 'bg-pink-500';
    case 'enhance': return 'bg-green-500';
    case 'colorize': return 'bg-amber-500';
    case 'art': return 'bg-red-500'; // Recolor (was Art)
    case 'blur': return 'bg-indigo-500';
    case 'background-removal': return 'bg-cyan-600';
    default: return 'bg-gray-500';
  }
};

// Desktop Floating Dock for Tools
const FloatingDockTools = ({
  tools,
  currentTool,
  onSelectTool,
}) => {
  let mouseX = useMotionValue(Infinity);
  
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-auto flex justify-center h-20 gap-4 items-end rounded-2xl bg-gray-50 dark:bg-neutral-900 px-4 pb-3"
    >
      {tools.map((tool) => (
        <ToolIcon 
          mouseX={mouseX} 
          key={tool.id}
          tool={tool}
          isActive={currentTool === tool.id}
          onClick={() => onSelectTool(tool.id)}
        />
      ))}
    </motion.div>
  );
};

// Individual Tool Icon with Animation
function ToolIcon({
  mouseX,
  tool,
  isActive,
  onClick,
}) {
  let ref = useRef(null);
  const [hovered, setHovered] = useState(false);
 
  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });
 
  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
 
  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  let heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
 
  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
 
  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <div onClick={onClick}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "aspect-square rounded-full flex items-center justify-center relative cursor-pointer",
          isActive 
            ? getToolColor(tool.id) + " text-white" 
            : "bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="px-2 py-0.5 whitespace-pre rounded-md bg-gray-100 border dark:bg-neutral-800 dark:border-neutral-900 dark:text-white border-gray-200 text-neutral-700 absolute left-1/2 -translate-x-1/2 -top-8 w-fit text-xs"
            >
              {tool.title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center text-current"
        >
          {tool.icon}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default AnimatedToolNavigation;