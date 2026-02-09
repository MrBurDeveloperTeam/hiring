import * as React from "react"
import { cn } from "../../lib/utils"

const AvatarContext = React.createContext<{
    onImageLoadingStatusChange: (status: ImageLoadingStatus) => void
}>({
    onImageLoadingStatusChange: () => { },
})

type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error"

const Avatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const [status, setStatus] = React.useState<ImageLoadingStatus>("idle")

    return (
        <AvatarContext.Provider
            value={{
                onImageLoadingStatusChange: setStatus,
            }}
        >
            <div
                ref={ref}
                className={cn(
                    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
                    className
                )}
                {...props}
            />
        </AvatarContext.Provider>
    )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, ...props }, ref) => {
    const { onImageLoadingStatusChange } = React.useContext(AvatarContext)
    const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>("idle")

    React.useEffect(() => {
        if (!src) {
            setLoadingStatus("error")
            onImageLoadingStatusChange("error")
            return
        }
        let isMounted = true
        const image = new Image()

        const updateStatus = (status: ImageLoadingStatus) => {
            if (!isMounted) return
            setLoadingStatus(status)
            onImageLoadingStatusChange(status)
        }

        setLoadingStatus("loading")
        updateStatus("loading")
        image.src = src
        image.onload = () => updateStatus("loaded")
        image.onerror = () => updateStatus("error")

        return () => {
            isMounted = false
        }
    }, [src, onImageLoadingStatusChange])

    if (loadingStatus !== "loaded") {
        return null
    }

    return (
        <img
            ref={ref}
            src={src}
            className={cn("aspect-square h-full w-full", className)}
            {...props}
        />
    )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-muted",
            className
        )}
        {...props}
    />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
