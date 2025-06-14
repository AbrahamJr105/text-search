# Text Search Engine

A modern, web-based text search application built with Next.js and Tailwind CSS that allows users to upload text files, index their contents, and search across them using different similarity measures.

![Text Search Engine](public/placeholder.jpg)

## Features

- **File Upload**: Upload multiple text files for analysis
- **Text Processing**: Processes text using tokenization, stemming, and stopword removal
- **Indexing**: Calculates Term Frequency (TF) and Term Frequency-Inverse Document Frequency (TF-IDF) for all terms
- **Search Functionality**: Search across indexed documents using:
  - Dot Product similarity
  - Cosine similarity
- **Results Ranking**: View ranked search results with similarity scores
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui components

## Technologies Used

- [Next.js 15](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [NLP.js](https://github.com/axa-group/nlp.js) - Natural Language Processing library (French language support)
- [Lucide React](https://lucide.dev/) - Icon library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/text-search.git
   cd text-search
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload Files**: 
   - Navigate to the "Upload" tab
   - Click to browse or drag and drop .txt files
   - Once files are uploaded, click "Index Files"

2. **View Index**:
   - After indexing completes, you'll be redirected to the "Index" tab
   - Browse the TF-IDF matrix showing term weights across all documents

3. **Search**:
   - Go to the "Search" tab
   - Enter keywords in the search box
   - Choose between "Dot Product" or "Cosine Similarity" search methods
   - View ranked results with similarity scores

## How It Works

### Text Processing Pipeline

1. **Tokenization & Stemming**: Breaks text into tokens and reduces words to their root form
2. **Stopword Removal**: Filters out common words with low information value
3. **Term Frequency (TF) Calculation**: Measures how frequently a term occurs in a document
4. **TF-IDF Calculation**: Weighs terms by their importance across the document collection
5. **Similarity Calculation**: Compares query vectors with document vectors using:
   - Dot Product: Simple multiplication of matching term weights
   - Cosine Similarity: Normalized similarity accounting for document length

## Building for Production

```bash
pnpm build
pnpm start
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- French language processing with [NLP.js](https://github.com/axa-group/nlp.js)
