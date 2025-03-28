import React from 'react'

export default function ArticleSkeleton() {
    return (
        <section className='min-h-full bg-gradient-to-b from-gray-50 to-white'>
            <div className="container mx-auto px-4 xl:px-10 py-12 sm:py-16">
                {/* Filter Section Skeleton */}
                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-12'>
                    <div className='category-filter flex flex-wrap gap-4'>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-10 w-24 bg-gray-100 rounded-xl relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                            </div>
                        ))}
                    </div>
                    <div className='search-filter w-full sm:w-64'>
                        <div className="h-11 w-full bg-gray-100 rounded-full relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                        </div>
                    </div>
                </div>

                {/* Top Article Skeleton */}
                <div className="mb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 place-items-center bg-white rounded-3xl p-6 border border-gray-100">
                        <div className="w-full h-[150px] md:h-[350px] bg-gray-100 rounded-2xl relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                        </div>

                        <div className="flex flex-col gap-6 w-full">
                            <div className="h-8 w-32 bg-gray-100 rounded-full relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-8 w-3/4 bg-gray-100 rounded-lg relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                </div>
                                <div className="h-8 w-1/2 bg-gray-100 rounded-lg relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                </div>
                            </div>
                            <div className="h-20 w-full bg-gray-100 rounded-lg relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full relative overflow-hidden">
                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-gray-100 rounded relative overflow-hidden">
                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                        </div>
                                        <div className="h-3 w-20 bg-gray-100 rounded relative overflow-hidden">
                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-4 w-32 bg-gray-100 rounded relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Articles Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                            <div className="w-full h-[250px] bg-gray-100 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                            </div>
                            <div className="p-6">
                                <div className="h-4 w-20 bg-gray-100 rounded mb-2 relative overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="h-6 w-3/4 bg-gray-100 rounded relative overflow-hidden">
                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                    </div>
                                    <div className="h-6 w-1/2 bg-gray-100 rounded relative overflow-hidden">
                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full relative overflow-hidden">
                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-4 w-24 bg-gray-100 rounded relative overflow-hidden">
                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                            </div>
                                            <div className="h-3 w-20 bg-gray-100 rounded relative overflow-hidden">
                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-4 w-20 bg-gray-100 rounded relative overflow-hidden">
                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-white to-gray-100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

    )
}