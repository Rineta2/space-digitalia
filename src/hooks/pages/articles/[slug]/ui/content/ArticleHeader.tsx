import { format } from 'date-fns'

import ShareButtons from '@/hooks/pages/articles/[slug]/ShareButton'

type ArticleHeaderProps = {
    title: string
    category: string
    createdAt: string
    viewCount: number
    thumbnail: string
    currentUrl: string
}

export default function ArticleHeader({
    title,
    category,
    createdAt,
    viewCount,
    thumbnail,
    currentUrl
}: ArticleHeaderProps) {
    return (
        <div className="space-y-8 mb-12">
            <h1 className='text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight tracking-tight'>
                {title}
            </h1>

            <div className='flex flex-wrap items-center gap-4'>
                <div className='text-sm text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full capitalize font-medium hover:bg-indigo-100 transition-colors'>
                    {category}
                </div>
                <span className='text-sm text-gray-600 font-medium flex items-center gap-2'>
                    <CalendarIcon />
                    {format(new Date(createdAt), 'MMMM dd, yyyy')}
                </span>
                <span className='text-sm text-gray-600 font-medium flex items-center gap-2'>
                    <EyeIcon />
                    {viewCount} views
                </span>
            </div>

            <ShareButtons
                url={currentUrl}
                title={title}
                description={`Check out this article: ${title}`}
                media={thumbnail}
            />
        </div>
    )
}

const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
)