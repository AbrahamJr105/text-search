"use client"

import { useState, type ChangeEvent } from "react"
import { StemmerFr, StopwordsFr } from "@nlpjs/lang-fr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Upload, Search, FileText, BarChart2, FileUp } from "lucide-react"

export default function TextSearchEngine() {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})
  const [tableTF, setTableTF] = useState<[string, ...number[]][]>([])
  const [tableTFIDF, setTableTFIDF] = useState<[string, ...number[]][]>([])
  const [searchResults, setSearchResults] = useState<[string, number][]>([])
  const [activeTab, setActiveTab] = useState("upload")
  const [query, setQuery] = useState("")
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexingProgress, setIndexingProgress] = useState(0)

  const stemmer = new StemmerFr()
  const stopwords = new StopwordsFr()

  // Helper function to count word occurrences in text
  const countWordInText = (word: string, tokens: string[]) => {
    return tokens.filter((token) => token === word).length
  }

  function docDotProdSim(queryTF: Record<string, number>, docObj: Record<string, number>) {
    let dot = 0
    for (const term in queryTF) {
      if (Object.prototype.hasOwnProperty.call(docObj, term)) {
        dot += queryTF[term] * docObj[term]
      }
    }
    return dot
  }

  function docCosineSimilarity(queryTF: Record<string, number>, docObj: Record<string, number>) {
    // dot product
    const dot = docDotProdSim(queryTF, docObj)
    // magnitude of each vector
    const magQuery = Math.sqrt(Object.values(queryTF).reduce((sum: number, f) => sum + f * f, 0))
    const docMag = Math.sqrt(Object.values(docObj).reduce((sum: number, f) => sum + f * f, 0))
    if (magQuery === 0 || docMag === 0) {
      return 0
    }
    return dot / (magQuery * docMag)
  }

  // Helper function to calculate term‐frequency for a query
  const calculateQueryTf = (query: string): Record<string, number> => {
    let tokens: string[] = stemmer.tokenizeAndStem(query) as string[]
    tokens = tokens.filter((token: string) => !stopwords.isStopword(token))
    const counts: Record<string, number> = {}
    let maxFreq = 0
    tokens.forEach((tok: string) => {
      counts[tok] = (counts[tok] || 0) + 1
      maxFreq = Math.max(maxFreq, counts[tok])
    })
    const tf: Record<string, number> = {}
    if (maxFreq > 0) {
      Object.keys(counts).forEach((tok: string) => {
        tf[tok] = counts[tok] / maxFreq
      })
    }
    return tf
  }

  function calculateDotProductSim(queryTF: Record<string, number>): [string, number][] {
    const results: Record<string, number> = {}
    if (!tableTF.length) return []
    const numFiles = tableTF[0].length - 1
    for (let fi = 1; fi <= numFiles; fi++) {
      const docObj: Record<string, number> = {}
      tableTF.forEach((row) => {
        const term = row[0]
        const val = row[fi]
        if (typeof val === "number" && val > 0) {
          docObj[term] = val
        }
      })
      results[Object.keys(uploadedFiles)[fi - 1]] = docDotProdSim(queryTF, docObj)
    }
    return Object.entries(results).sort((a, b) => b[1] - a[1])
  }

  function calculateCosSim(queryTF: Record<string, number>): [string, number][] {
    const results: Record<string, number> = {}
    if (!tableTF.length) return []
    const numFiles = tableTF[0].length - 1
    for (let fi = 1; fi <= numFiles; fi++) {
      const docObj: Record<string, number> = {}
      tableTF.forEach((row) => {
        const term = row[0]
        const val = row[fi]
        if (typeof val === "number" && val > 0) {
          docObj[term] = val
        }
      })
      results[Object.keys(uploadedFiles)[fi - 1]] = docCosineSimilarity(queryTF, docObj)
    }
    return Object.entries(results).sort((a, b) => b[1] - a[1])
  }

  // Separate file-upload handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) =>
      file.text().then((txt) => setUploadedFiles((prev) => ({ ...prev, [file.name]: txt }))),
    )
  }

  // Separate indexing handler
  const handleIndexing = async () => {
    setIsIndexing(true)
    setIndexingProgress(10)

    // Use setTimeout to allow the UI to update before starting the indexing process
    setTimeout(() => {
      let tokens: string[] = []
      const tokenizedFiles: Record<string, string[]> = {}

      // Step 1: Tokenize files
      setIndexingProgress(20)
      Object.entries(uploadedFiles).forEach(([fn, txt]) => {
        let tks: string[] = stemmer.tokenizeAndStem(txt)
        tks = tks.filter((token) => !stopwords.isStopword(token))
        tokenizedFiles[fn] = tks
        tokens = tokens.concat(tks)
      })

      // Step 2: Create unique token set
      setIndexingProgress(40)
      tokens = [...new Set(tokens)].sort()

      // Step 3: Calculate TF
      setIndexingProgress(60)
      const newTable: [string, ...number[]][] = []
      for (let i = 0; i < tokens.length; i++) {
        const word = tokens[i]
        const row: [string, ...number[]] = [word]
        Object.values(tokenizedFiles).forEach((fileTokens) => row.push(countWordInText(word, fileTokens)))
        newTable.push(row)
      }

      // Step 4: Normalize TF
      setIndexingProgress(70)
      const numFiles = newTable[0].length - 1
      for (let fileIndex = 1; fileIndex <= numFiles; fileIndex++) {
        let maxCountInFile = 0
        for (let wordIndex = 0; wordIndex < newTable.length; wordIndex++) {
          const val = newTable[wordIndex][fileIndex] as number
          if (val > maxCountInFile) {
            maxCountInFile = val
          }
        }
        if (maxCountInFile > 0) {
          for (let wordIndex = 0; wordIndex < newTable.length; wordIndex++) {
            const val = newTable[wordIndex][fileIndex] as number
            newTable[wordIndex][fileIndex] = val / maxCountInFile
          }
        }
      }

      // Create a deep copy for the TF table BEFORE calculating IDF
      setTableTF(newTable.map((row) => [...row]))

      // Step 5: Calculate TF-IDF
      setIndexingProgress(90)
      for (let word = 0; word < newTable.length; word++) {
        const row = newTable[word]
        const numDocsContainingTerm = (row.slice(1) as number[]).filter((v) => v > 0).length
        // Avoid division by zero if a term somehow isn't in any docs
        if (numDocsContainingTerm === 0) continue
        let idf = Math.log2(Object.keys(uploadedFiles).length / numDocsContainingTerm)
        // Ensure IDF is non-negative
        idf = Math.max(0, idf)
        for (let i = 1; i < row.length; i++) {
          const val = newTable[word][i] as number
          newTable[word][i] = val * idf
        }
      }

      // Set the TF-IDF table using the modified newTable
      setTableTFIDF([...newTable])
      setIndexingProgress(100)

      // Complete indexing and switch to the index view
      setTimeout(() => {
        setIsIndexing(false)
        setActiveTab("index")
      }, 500)
    }, 100)
  }

  const handleSearch = (method: "dot" | "cosine") => {
    const queryTF = calculateQueryTf(query)
    if (method === "dot") {
      setSearchResults(calculateDotProductSim(queryTF))
    } else {
      setSearchResults(calculateCosSim(queryTF))
    }
  }

  const formatNumber = (num: number) => {
    return num.toFixed(4)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Text Search Engine</CardTitle>
          <CardDescription>Upload text files, index them, and search using TF-IDF</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" disabled={isIndexing}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="index" disabled={Object.keys(uploadedFiles).length === 0 || isIndexing}>
            <BarChart2 className="h-4 w-4 mr-2" />
            Index
          </TabsTrigger>
          <TabsTrigger value="search" disabled={tableTFIDF.length === 0 || isIndexing}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Text Files</CardTitle>
              <CardDescription>Select multiple .txt files to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
                <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="mb-4 text-sm text-muted-foreground">Drag and drop files here or click to browse</p>
                <Input type="file" accept=".txt" multiple onChange={handleFileUpload} className="max-w-sm" />
              </div>

              {Object.keys(uploadedFiles).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Uploaded Files</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(uploadedFiles).map((filename, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {filename}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleIndexing} disabled={Object.keys(uploadedFiles).length === 0 || isIndexing}>
                {isIndexing ? "Indexing..." : "Index Files"}
              </Button>
            </CardFooter>
          </Card>

          {isIndexing && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Indexing files...</span>
                    <span className="text-sm">{indexingProgress}%</span>
                  </div>
                  <Progress value={indexingProgress} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="index" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Term Frequency - Inverse Document Frequency</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("search")}>
                  Go to Search
                </Button>
              </CardTitle>
              <CardDescription>TF-IDF values for each term across all documents</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold sticky top-0 bg-background">Term</TableHead>
                      {Object.keys(uploadedFiles).map((filename, i) => (
                        <TableHead key={i} className="sticky top-0 bg-background">
                          {filename}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableTFIDF.map((row: [string, ...number[]], index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row[0]}</TableCell>
                        {row.slice(1).map((cell: number, cellIndex) => (
                          <TableCell key={cellIndex}>{formatNumber(cell)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Documents</CardTitle>
              <CardDescription>Enter keywords to search across indexed documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  type="text"
                  placeholder="Type keywords..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => handleSearch("dot")} disabled={!query.trim()}>
                  Dot Product
                </Button>
                <Button onClick={() => handleSearch("cosine")} disabled={!query.trim()} variant="secondary">
                  Cosine Similarity
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Search Results</h3>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map(([file, score], i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-medium">{file}</TableCell>
                            <TableCell>{formatNumber(score)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
