# Admin Panel

This is the admin panel for the Typni website, built with React, TypeScript, and Tailwind CSS.

## Features

- Modern, responsive design
- Type-safe with TypeScript
- Real-time data with Supabase
- Beautiful UI with Tailwind CSS
- Efficient state management with React Query

## Prerequisites

- Node.js 16.x or later
- npm 7.x or later
- Supabase account and project

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- Follow the directory structure in `admin-structure.txt`
- Use TypeScript for all components
- Follow the rules in `rules.mdc`
- Use Tailwind CSS for styling
- Implement proper error handling
- Use React Query for data fetching
- Follow proper Git workflow

## Building for Production

```bash
npm run build
```

## Testing

```bash
npm run test
```

## Contributing

1. Follow the coding standards
2. Write tests for new features
3. Update documentation
4. Submit a pull request

## License

This project is licensed under the MIT License.
