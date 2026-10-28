import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl border border-border bg-card text-card-foreground shadow-xl text-[13px] px-4 py-3',
          description: 'text-muted-foreground text-[12px]',
          actionButton: 'bg-primary text-primary-foreground text-[12px] rounded-md',
          cancelButton: 'bg-muted text-muted-foreground text-[12px] rounded-md'
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
