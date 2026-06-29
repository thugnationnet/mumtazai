import React from 'react';
import { BlogPost } from '@/app/constants';

interface BlogPostViewerProps {
  post: BlogPost;
  onNavigate: (page: 'blog' | 'home') => void;
}

const BlogPostViewer: React.FC<BlogPostViewerProps> = ({ post, onNavigate }) => {
  const getEra = (year?: number | string) => {
    if (!year) return { name: 'Modern', color: 'bg-teal-500', icon: '🤖' };
    
    // Convert string years to number if needed (take the first year if range)
    const yearNum = typeof year === 'string' ? parseInt(year.split('-')[0]) : year;
    
    if (yearNum >= 1940 && yearNum <= 1955) return { name: 'Foundations', color: 'bg-purple-500', icon: '🧮' };
    if (yearNum >= 1956 && yearNum <= 1969) return { name: 'Birth of AI', color: 'bg-blue-500', icon: '🧠' };
    if (yearNum >= 1970 && yearNum <= 1979) return { name: 'Expert Systems', color: 'bg-green-500', icon: '💡' };
    if (yearNum >= 1980 && yearNum <= 1989) return { name: 'AI Winter', color: 'bg-gray-500', icon: '❄️' };
    if (yearNum >= 1990 && yearNum <= 1999) return { name: 'Revival', color: 'bg-orange-500', icon: '🔥' };
    if (yearNum >= 2000 && yearNum <= 2009) return { name: 'Data Era', color: 'bg-cyan-500', icon: '📊' };
    if (yearNum >= 2010 && yearNum <= 2019) return { name: 'Deep Learning', color: 'bg-indigo-500', icon: '🚀' };
    if (yearNum >= 2020 && yearNum <= 2025) return { name: 'Transformers', color: 'bg-pink-500', icon: '✨' };
    
    return { name: 'Modern', color: 'bg-teal-500', icon: '🤖' };
  };

  const getBackDestination = (): 'blog' | 'home' => {
    return 'blog';
  };

  const era = getEra(post.year);

  return (
    <div className="py-20 md:py-28 relative">
      {/* Header Spacer */}
      <div className="h-20"></div>
      
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
             <button onClick={() => onNavigate(getBackDestination())} title="Return to the blog page" className="text-purple-700 hover:text-purple-800 font-semibold transition-colors">
                &larr; Back to Blog
             </button>
             
             {/* Era Badge */}
             <span className={`${era.color} text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
               <span>{era.icon}</span>
               {era.name}
             </span>
          </div>
          
          <article>
            <div className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                {post.year && (
                  <span className="font-bold text-slate-900 px-3 py-1 rounded-lg text-sm shadow-md bg-gradient-to-r from-purple-100 to-indigo-100" style={{ 
                    border: '1px solid rgba(255, 255, 255, 0.6)'
                  }}>
                    {post.year}
                  </span>
                )}
                <span>{post.date}</span>
                {post.author && (
                  <>
                    <span className="mx-2">&bull;</span>
                    <span>By {post.author}</span>
                  </>
                )}
                {post.category && (
                  <>
                    <span className="mx-2">&bull;</span>
                    <span>{post.category}</span>
                  </>
                )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                {post.title}
            </h1>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-slate-500 px-3 py-1 rounded-full text-sm bg-white/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div 
              className="prose prose-lg max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }} 
            />
            
            {post.references && post.references.length > 0 && (
              <footer className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">References</h3>
                <ul className="space-y-2">
                  {post.references.map((ref: string, index: number) => (
                    <li key={index} className="text-sm text-slate-500">
                      {index + 1}. {ref}
                    </li>
                  ))}
                </ul>
              </footer>
            )}
          </article>
          
          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between">
             <button onClick={() => onNavigate(getBackDestination())} title="Return to the blog page" className="text-purple-700 hover:text-purple-800 transition-colors">
                &larr; Back to AI History
             </button>
             <button onClick={() => onNavigate('home')} title="Return to the homepage" className="text-slate-500 hover:text-purple-700 transition-colors">
                &larr; Back to Home
             </button>
          </div>
        </div>
      </div>
       <style>{`
            .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6, .prose strong { color: #1e293b; }
            .prose a { color: #7c3aed; }
            .prose a:hover { color: #6d28d9; }
            .prose blockquote { border-left-color: #7c3aed; color: #64748b; }
            .prose .grid { display: grid; }
            .prose .grid.md\\:grid-cols-2 { grid-template-columns: 1fr; }
            @media (min-width: 768px) {
              .prose .grid.md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            }
            .prose .gap-6 { gap: 1.5rem; }
            .prose .mb-6 { margin-bottom: 1.5rem; }
            .prose .p-6 { padding: 1.5rem; }
            .prose .rounded-lg { border-radius: 0.5rem; }
            .prose .space-y-2 > * + * { margin-top: 0.5rem; }
            .prose .text-sm { font-size: 0.875rem; }
            .prose .font-semibold { font-weight: 600; }
            .prose grid { display: grid; }
       `}</style>
    </div>
  );
};

export default BlogPostViewer;