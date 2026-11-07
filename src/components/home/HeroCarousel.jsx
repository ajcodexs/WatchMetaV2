import { useCallback, useEffect, useMemo, useState } from 'react'
import Fade from 'embla-carousel-fade'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Play, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import { backdropSrcSet } from '@/api/tmdbImages.js'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'

function shuffle(items) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

export default function HeroCarousel({ items }) {
  const slides = useMemo(() => shuffle(items).slice(0, 8), [items])
  const fadePlugins = useMemo(() => [Fade()], [])
  const [api, setApi] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const onSelect = useCallback((carouselApi) => {
    setActiveIndex(carouselApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('select', onSelect)
    return () => api.off('select', onSelect)
  }, [api, onSelect])

  useEffect(() => {
    if (!api || paused || slides.length < 2) return
    const timeout = window.setInterval(() => api.scrollNext(), 6000)
    return () => window.clearInterval(timeout)
  }, [api, paused, slides.length])

  if (slides.length === 0) {
    return (
      <section aria-label="Featured titles">
        <Skeleton className="h-screen h-[100svh] w-screen lg:w-full" />
        <h1 className="sr-only">Discover movies and TV shows</h1>
      </section>
    )
  }

  return (
    <section aria-label="Featured titles" className="w-screen lg:w-full">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, duration: 35 }}
        plugins={fadePlugins}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        className="overflow-hidden"
      >
        <CarouselContent className="-ml-0">
          {slides.map((item, index) => {
            const title = item.title ?? item.name
            const detailsPath = `/${item.type}/${item.id}`
            const watchPath = `/watch/${item.type}/${item.id}`
            const Heading = activeIndex === index ? 'h1' : 'h2'
            return (
              <CarouselItem
                key={`${item.type}-${item.id}`}
                className="pl-0"
                aria-hidden={activeIndex !== index}
              >
                <article
                  className="relative flex h-screen h-[100svh] w-screen items-end overflow-hidden bg-card lg:w-full"
                >
                  <img
                    src={item.backdropPath}
                    srcSet={item.backdropSrcSet}
                    sizes="(min-width: 1920px) 100vw, 1280px"
                    alt={`${title} backdrop`}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover object-center"
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
                  <div className="relative z-10 max-w-3xl space-y-4 px-4 pb-[calc(64px+env(safe-area-inset-bottom)+24px)] pt-12 text-white sm:px-8 sm:pb-28 lg:p-12">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/85">
                      <span>{item.year}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Star aria-hidden="true" className="size-4 fill-highlight text-highlight" />
                        {item.rating.toFixed(1)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.type === 'movie' ? `${item.runtime} min` : `${item.seasons} seasons`}</span>
                    </div>
                    <Heading className="text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</Heading>
                    <p className="line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                      {item.overview}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Button asChild className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link to={watchPath} tabIndex={activeIndex === index ? 0 : -1}>
                          <Play aria-hidden="true" className="size-4 fill-current" />
                          Play
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-xl border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                        <Link to={detailsPath} tabIndex={activeIndex === index ? 0 : -1}>More Info</Link>
                      </Button>
                      <WatchlistButton
                        item={item}
                        variant="inline"
                        size="md"
                        tabIndex={activeIndex === index ? 0 : -1}
                        className="border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      />
                    </div>
                  </div>
                </article>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous featured title"
          onClick={() => api?.scrollPrev()}
          className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border-white/50 bg-black/30 text-white hover:bg-black/50 hover:text-white lg:inline-flex"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next featured title"
          onClick={() => api?.scrollNext()}
          className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border-white/50 bg-black/30 text-white hover:bg-black/50 hover:text-white lg:inline-flex"
        >
          <ArrowRight aria-hidden="true" />
        </Button>
        <div className="absolute bottom-[calc(64px+env(safe-area-inset-bottom)+20px)] right-4 z-30 flex gap-2 sm:right-8 lg:bottom-8">
          {slides.map((item, index) => (
            <button
              key={`${item.type}-${item.id}-dot`}
              type="button"
              aria-label={`Show featured title ${index + 1}`}
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => api?.scrollTo(index)}
              className={`size-2.5 rounded-full transition-colors ${
                activeIndex === index ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </Carousel>
    </section>
  )
}
