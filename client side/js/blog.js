// Import necessary functions from supabaseClient
import { getPublishedBlogPosts, getBlogPostById, getPostsByCategory, getRecentBlogPosts } from '../utils/supabaseClient.js';

// Global variable to store all blog posts
let allBlogPosts = [];
let currentCategory = null;

// Function to initialize filter buttons with client-side filtering
async function initFilterButtons() {
  const filterContainer = document.querySelector('.mix-item-menu');
  if (!filterContainer) return;
  
  try {
    // Fetch all blog posts to get unique categories
    const { data: posts, error } = await getPublishedBlogPosts();
    
    if (error) throw error;
    
    // Extract unique categories
    const categories = [...new Set(posts.map(post => post.category))]
      .map(name => ({ name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Check if there are any categories
    if (!categories || categories.length === 0) {
      return;
    }
    
    // Get current category from URL if any
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category');
    
    // Clear "active" class from all buttons
    const allButtons = filterContainer.querySelectorAll('button');
    allButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    // Set "active" class on All Blogs button if no category is selected
    if (!currentCategory) {
      const allButton = filterContainer.querySelector('button[data-filter="*"]');
      if (allButton) allButton.classList.add('active');
    }
    
    // Add event listener to "All Blogs" button for client-side filtering
    const allButton = filterContainer.querySelector('button[data-filter="*"]');
    if (allButton) {
      allButton.addEventListener('click', () => {
        // Update active button
        const allButtons = filterContainer.querySelectorAll('button');
        allButtons.forEach(btn => btn.classList.remove('active'));
        allButton.classList.add('active');
        
        // Filter posts client-side
        filterBlogPosts(null);
      });
    }
    
    // Add category filter buttons (limit to 5 most popular categories)
    categories.slice(0, 5).forEach(category => {
      const button = document.createElement('button');
      button.setAttribute('data-filter', category.name);
      button.textContent = category.name;
      
      // Mark as active if this is the current category
      if (currentCategory && currentCategory === category.name) {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        // Update active button
        allButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Filter posts client-side
          filterBlogPosts(category.name);
      });
      
      filterContainer.appendChild(button);
    });
  } catch (error) {
    console.error('Error initializing filter buttons:', error);
  }
}

// Function to filter blog posts client-side
function filterBlogPosts(category) {
  // Update current category
  currentCategory = category;
  
  // Update URL without reloading the page
  const url = new URL(window.location);
  if (category) {
    url.searchParams.set('category', category);
  } else {
    url.searchParams.delete('category');
  }
  window.history.pushState({}, '', url);
  
  // Update the page heading to show the category
  const pageHeading = document.querySelector('.breadcrumb-area h1');
  if (pageHeading) {
    pageHeading.textContent = category ? `${category} Blogs` : 'Blog';
  }
  
  // Also update the filter heading
  const filterHeading = document.querySelector('.site-heading h2');
  if (filterHeading) {
    filterHeading.textContent = category ? `${category} Blogs` : 'Our Blog';
  }
  
  // Filter and display posts
  const blogContainer = document.querySelector('.blog-content');
  if (!blogContainer) return;
  
  // Clear loading indicator
  blogContainer.innerHTML = '';
  
  // Filter posts based on category
  const filteredPosts = category 
    ? allBlogPosts.filter(post => post.category === category)
    : allBlogPosts;
  
  // Check if there are any posts after filtering
  if (!filteredPosts || filteredPosts.length === 0) {
    blogContainer.innerHTML = '<div class="text-center p-5">No blog posts found in this category.</div>';
    return;
  }
  
  // Render filtered posts
  renderBlogPosts(filteredPosts, blogContainer);
}

// Function to render blog posts in the container
function renderBlogPosts(posts, container) {
  // Clear container
  container.innerHTML = '';
  
  // Render each blog post
  posts.forEach(post => {
    const postDate = new Date(post.publish_date || post.created_at);
    const month = postDate.toLocaleString('default', { month: 'short' });
    const day = postDate.getDate();

    const postElement = document.createElement('div');
    postElement.className = 'col-md-4 col-sm-6 equal-height';
    postElement.innerHTML = `
      <div class="item-box">
        <div class="item">
          <div class="thumb">
            <a href="blog.html?id=${post.id}">
              <img src="${post.thumbnail_url || 'assets/img/800x600.png'}" alt="${post.title}">
              <div class="overlay-icon">
                <i class="fa fa-images"></i>
              </div>
            </a>
          </div>
          <div class="info">
            <div class="title-meta">
              <div class="date">
                ${day} <span>${month}</span>
              </div>
              <div class="title">
                <h4>
                  <a href="blog.html?id=${post.id}">${post.title}</a>
                </h4>
                <div class="meta">
                  <ul>
                    <li>
                      <a href="#"><i class="fas fa-user"></i> ${post.author}</a>
                    </li>
                    <li>
                      <i class="fas fa-calendar-alt"></i> ${postDate.toLocaleDateString()}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p>${post.excerpt}</p>
            <a href="blog.html?id=${post.id}">read more <i class="fas fa-angle-right"></i></a>
          </div>
        </div>
      </div>
    `;

    container.appendChild(postElement);
  });
}

// Function to initialize blog listing page
async function initBlogListingPage() {
  const blogContainer = document.querySelector('.blog-content');
  if (!blogContainer) return;

  try {
    // Show loading state
    blogContainer.innerHTML = '<div class="text-center p-5">Loading blogs...</div>';

    // Get current category from URL if any
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category');

    // Fetch all published blog posts
    const { data: posts, error } = await getPublishedBlogPosts();

    if (error) throw error;

    // Store all posts globally
    allBlogPosts = posts;

    // Check if there are any posts
    if (!posts || posts.length === 0) {
      blogContainer.innerHTML = '<div class="text-center p-5">No blog posts found.</div>';
      return;
    }

    // If there's a category filter, apply it
    if (currentCategory) {
      // Update the page heading to show the category
      const pageHeading = document.querySelector('.breadcrumb-area h1');
      if (pageHeading) {
        pageHeading.textContent = `${currentCategory} Blogs`;
      }
      
      // Also update the filter heading
      const filterHeading = document.querySelector('.site-heading h2');
      if (filterHeading) {
        filterHeading.textContent = `${currentCategory} Blogs`;
      }
      
      // Filter posts by category
      const filteredPosts = posts.filter(post => post.category === currentCategory);
      
      // Render filtered posts
      renderBlogPosts(filteredPosts, blogContainer);
    } else {
      // Render all posts
      renderBlogPosts(posts, blogContainer);
    }

    // Setup pagination if needed
    setupPagination(posts.length);

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    blogContainer.innerHTML = `<div class="text-center p-5">Error loading blogs: ${error.message}</div>`;
  }
}

// Function to format blog content with proper typography
function formatBlogContent(content) {
  if (!content) return '';
  
  // Convert line breaks to paragraphs
  let formattedContent = content
    // Split by double line breaks (paragraph breaks)
    .split('\n\n')
    .filter(paragraph => paragraph.trim().length > 0)
    .map(paragraph => {
      const trimmed = paragraph.trim();
      
      // Check if it's a heading (starts with #)
      if (trimmed.startsWith('# ')) {
        return `<h2 class="blog-heading">${trimmed.substring(2)}</h2>`;
      } else if (trimmed.startsWith('## ')) {
        return `<h3 class="blog-subheading">${trimmed.substring(3)}</h3>`;
      } else if (trimmed.startsWith('### ')) {
        return `<h4 class="blog-subheading-small">${trimmed.substring(4)}</h4>`;
      }
      
      // Check if it's a list item (starts with - or *)
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<li class="blog-list-item">${trimmed.substring(2)}</li>`;
      }
      
      // Check if it's a numbered list item
      else if (/^\d+\.\s/.test(trimmed)) {
        return `<li class="blog-list-item">${trimmed.replace(/^\d+\.\s/, '')}</li>`;
      }
      
      // Check if it's a quote (starts with >)
      else if (trimmed.startsWith('> ')) {
        return `<blockquote class="blog-quote">${trimmed.substring(2)}</blockquote>`;
      }
      
      // Regular paragraph
      else {
        return `<p class="blog-paragraph">${trimmed}</p>`;
      }
    })
    .join('\n');
  
  // Wrap consecutive list items in ul/ol tags
  formattedContent = wrapListItems(formattedContent);
  
  // Apply inline formatting
  formattedContent = applyInlineFormatting(formattedContent);
  
  return formattedContent;
}

// Function to wrap list items in proper ul/ol tags
function wrapListItems(content) {
  // Wrap consecutive <li> items in <ul>
  content = content.replace(/(<li class="blog-list-item">.*?<\/li>\n?)+/gs, (match) => {
    return `<ul class="blog-list">${match}</ul>`;
  });
  
  return content;
}

// Function to apply inline formatting (bold, italic, links)
function applyInlineFormatting(content) {
  // Bold text **text** or __text__
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic text *text* or _text_
  content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
  content = content.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Code spans `code`
  content = content.replace(/`(.*?)`/g, '<code class="blog-code">$1</code>');
  
  // Links [text](url)
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="blog-link" target="_blank">$1</a>');
  
  return content;
}

// Function to extract blog ID from URL
function getBlogIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// Function to initialize blog detail page
async function initBlogDetailPage() {
  // Check if we're on a blog detail page and if there's an ID parameter
  const blogId = getBlogIdFromUrl();
  const blogContentContainer = document.querySelector('.blog-area.single-blog .item');
  
  // If not on a detail page or no ID, return
  if (!blogContentContainer || !blogId) {
    // Check if we're on blog.html but there's no ID
    if (window.location.pathname.includes('blog.html') && !blogId) {
      // This might be the static page with no ID, so redirect to blog-page.html
      window.location.href = 'blog-page.html';
    }
    return;
  }

  try {
    // Show loading state
    blogContentContainer.innerHTML = '<div class="text-center p-5">Loading blog post...</div>';

    // Fetch the blog post details
    const { data: post, error } = await getBlogPostById(blogId);

    if (error) throw error;

    if (!post) {
      blogContentContainer.innerHTML = '<div class="text-center p-5">Blog post not found.</div>';
      return;
    }

    // Format date
    const postDate = new Date(post.publish_date || post.created_at);
    const month = postDate.toLocaleString('default', { month: 'short' });
    const day = postDate.getDate();

    // Update the page with blog post content
    document.title = `Typni - ${post.title}`;

    // Update blog content
    blogContentContainer.innerHTML = `
      <div class="thumb">
        <img src="${post.thumbnail_url || 'assets/img/hero1.jpg'}" alt="${post.title}">
      </div>
      <div class="info">
        <div class="title-meta">
          <div class="date">
            ${day} <span>${month}</span>
          </div>
          <div class="title">
            <h3>${post.title}</h3>
            <div class="meta">
              <ul>
                <li>
                  <a href="#"><i class="fas fa-user"></i> ${post.author}</a>
                </li>
                <li>
                  <i class="fas fa-calendar-alt"></i> ${postDate.toLocaleDateString()}
                </li>
                <li>
                  <a href="blog-page.html?category=${encodeURIComponent(post.category)}">
                    <i class="fas fa-folder"></i> ${post.category}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="blog-content formatted-content">
          ${formatBlogContent(post.content)}
        </div>
      </div>
    `;

    // Update breadcrumb
    const breadcrumbTitle = document.querySelector('.breadcrumb-area h1');
    if (breadcrumbTitle) {
      breadcrumbTitle.textContent = post.title;
    }

  } catch (error) {
    console.error('Error fetching blog post:', error);
    blogContentContainer.innerHTML = `<div class="text-center p-5">Error loading blog post: ${error.message}</div>`;
  }
}

// Function to set up pagination
function setupPagination(totalPosts) {
  // Implement pagination if needed
}

// Function to initialize blog sidebar
async function initBlogSidebar() {
  try {
    // Initialize categories
    await initCategories();
    
    // Initialize recent posts
    await initRecentPosts();
  } catch (error) {
    console.error('Error initializing blog sidebar:', error);
  }
}

// Function to populate blog categories
async function initCategories() {
  const categoryContainer = document.querySelector('.sidebar-item.category .sidebar-info ul');
  if (!categoryContainer) return;
  
  try {
    // Show loading state
    categoryContainer.innerHTML = '<li>Loading categories...</li>';
    
    // Fetch all blog posts to get categories
    const { data: posts, error } = await getPublishedBlogPosts();
    
    if (error) throw error;
    
    // Extract unique categories and count posts in each category
    const categoryMap = posts.reduce((acc, post) => {
      if (!acc[post.category]) {
        acc[post.category] = 0;
      }
      acc[post.category]++;
      return acc;
    }, {});

    const categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Check if there are any categories
    if (!categories || categories.length === 0) {
      categoryContainer.innerHTML = '<li>No categories found</li>';
      return;
    }
    
    // Clear loading indicator
    categoryContainer.innerHTML = '';
    
    // Render each category
    categories.forEach(category => {
      const categoryElement = document.createElement('li');
      categoryElement.innerHTML = `
        <a href="blog-page.html?category=${encodeURIComponent(category.name)}">
          ${category.name} <span>(${category.count})</span>
        </a>
      `;
      
      categoryContainer.appendChild(categoryElement);
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    categoryContainer.innerHTML = '<li>Error loading categories</li>';
  }
}

// Function to populate recent posts
async function initRecentPosts() {
  const recentPostsContainer = document.querySelector('.sidebar-item.recent-post ul');
  if (!recentPostsContainer) return;
  
  try {
    // Show loading state
    recentPostsContainer.innerHTML = '<li>Loading recent posts...</li>';
    
    // Fetch recent blog posts
    const { data: recentPosts, error } = await getRecentBlogPosts(3);
    
    if (error) throw error;
    
    // Check if there are any recent posts
    if (!recentPosts || recentPosts.length === 0) {
      recentPostsContainer.innerHTML = '<li>No recent posts found</li>';
      return;
    }
    
    // Clear loading indicator
    recentPostsContainer.innerHTML = '';
    
    // Render each recent post
    recentPosts.forEach(post => {
      const postDate = new Date(post.publish_date || post.created_at);
      const formattedDate = postDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const postElement = document.createElement('li');
      postElement.innerHTML = `
        <div class="thumb">
          <a href="blog.html?id=${post.id}">
            <img src="${post.thumbnail_url || 'assets/img/800x800.png'}" alt="${post.title}">
          </a>
        </div>
        <div class="info">
          <a href="blog.html?id=${post.id}">${post.title}</a>
          <div class="meta-title">
            <span class="post-date">${formattedDate}</span> | By <a href="#">${post.author}</a>
          </div>
        </div>
      `;
      
      recentPostsContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error('Error loading recent posts:', error);
    recentPostsContainer.innerHTML = '<li>Error loading recent posts</li>';
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get blog ID from URL if it exists
  const blogId = getBlogIdFromUrl();
  
  // Check which page we're on and initialize accordingly
  const path = window.location.pathname;
  
  if (path.includes('blog-page.html')) {
    // Blog listing page
    initFilterButtons(); // Initialize filter buttons
    initBlogListingPage();
    initBlogSidebar(); // Initialize sidebar on blog listing page
  } else if ((path.includes('blog.html') || path.includes('blog-single.html')) && blogId) {
    // Blog detail page with ID parameter
    initBlogDetailPage();
    initBlogSidebar(); // Initialize sidebar on blog detail page
  } else if (path.includes('blog.html') && !blogId) {
    // Blog detail page without ID - check if it's a static or dynamic page
    const staticBlogContent = document.querySelector('.blog-area.single-blog .item .info .title h3');
    if (staticBlogContent) {
      // This is a static blog page, no need to fetch content
      console.log('Static blog page detected');
      initBlogSidebar(); // Still initialize the sidebar
    } else {
      // This is likely supposed to be the blog listing page
      console.log('No blog ID found, redirecting to blog listing');
      window.location.href = 'blog-page.html';
    }
  }
}); 