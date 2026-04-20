export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-sm text-muted-foreground">
            Made by{' '}
            <a 
              href="https://github.com/abeerpathela" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              AbeerPathela
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
