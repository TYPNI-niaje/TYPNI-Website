import type { FC } from 'react';

interface BlogPreviewProps {
  content: string;
  title?: string;
}

// Format blog content for preview (same as client-side function)
const formatBlogContent = (content: string) => {
  if (!content) return '';
  
  // Convert line breaks to paragraphs
  let formattedContent = content
    .split('\n\n')
    .filter(paragraph => paragraph.trim().length > 0)
    .map(paragraph => {
      const trimmed = paragraph.trim();
      
      // Check if it's a heading
      if (trimmed.startsWith('# ')) {
        return `<h2 style="font-size: 2.5rem; font-weight: 700; color: #1a202c; margin: 2.5rem 0 1.5rem 0; line-height: 1.3; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">${trimmed.substring(2)}</h2>`;
      } else if (trimmed.startsWith('## ')) {
        return `<h3 style="font-size: 2rem; font-weight: 600; color: #2d3748; margin: 2rem 0 1rem 0; line-height: 1.4;">${trimmed.substring(3)}</h3>`;
      } else if (trimmed.startsWith('### ')) {
        return `<h4 style="font-size: 1.5rem; font-weight: 600; color: #2d3748; margin: 1.5rem 0 0.75rem 0; line-height: 1.4;">${trimmed.substring(4)}</h4>`;
      }
      
      // Check if it's a list item
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<li style="font-size: 1.2rem; line-height: 1.7; margin: 0.5rem 0; color: #4a5568;">${trimmed.substring(2)}</li>`;
      }
      
      // Check if it's a numbered list item
      else if (/^\d+\.\s/.test(trimmed)) {
        return `<li style="font-size: 1.2rem; line-height: 1.7; margin: 0.5rem 0; color: #4a5568;">${trimmed.replace(/^\d+\.\s/, '')}</li>`;
      }
      
      // Check if it's a quote
      else if (trimmed.startsWith('> ')) {
        return `<blockquote style="font-size: 1.4rem; font-style: italic; color: #2d3748; margin: 2rem 0; padding: 1.5rem 2rem; border-left: 4px solid #3182ce; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 0 8px 8px 0; position: relative;">${trimmed.substring(2)}</blockquote>`;
      }
      
      // Regular paragraph
      else {
        return `<p style="font-size: 1.25rem; line-height: 1.8; margin: 1.5rem 0; color: #4a5568; text-align: justify;">${trimmed}</p>`;
      }
    })
    .join('\n');
  
  // Wrap consecutive list items in ul tags
  formattedContent = formattedContent.replace(/(<li style="[^"]*">.*?<\/li>\n?)+/gs, (match) => {
    return `<ul style="margin: 1.5rem 0; padding-left: 2rem;">${match}</ul>`;
  });
  
  // Apply inline formatting
  formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedContent = formattedContent.replace(/__(.*?)__/g, '<strong>$1</strong>');
  formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formattedContent = formattedContent.replace(/_(.*?)_/g, '<em>$1</em>');
  formattedContent = formattedContent.replace(/`(.*?)`/g, '<code style="font-family: Fira Code, Monaco, Consolas, monospace; font-size: 0.9em; background: #f7fafc; color: #e53e3e; padding: 0.2rem 0.4rem; border-radius: 4px; border: 1px solid #e2e8f0;">$1</code>');
  formattedContent = formattedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3182ce; text-decoration: none; border-bottom: 1px solid transparent;" target="_blank">$1</a>');
  
  return formattedContent;
};

const BlogPreview: FC<BlogPreviewProps> = ({ content, title }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4 pb-2 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
        <p className="text-sm text-gray-500">How your blog post will appear to readers</p>
      </div>
      
      <div className="space-y-4">
        {title && (
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
        )}
        
        <div 
          className="formatted-content"
          style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.7',
            color: '#2d3748',
            maxWidth: 'none'
          }}
          dangerouslySetInnerHTML={{ 
            __html: content ? formatBlogContent(content) : '<p style="color: #9ca3af; font-style: italic;">Start writing your content to see the preview...</p>' 
          }}
        />
      </div>
    </div>
  );
};

export default BlogPreview;