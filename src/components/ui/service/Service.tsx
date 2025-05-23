"use client";

import React, { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion';
import { FetchService } from '@/components/ui/service/lib/FetchService'
import { ServiceType } from '@/components/ui/service/lib/schema'
import ServiceSkeleton from '@/components/ui/service/ServiceSkelaton';
import ServicePaths from '@/components/ui/service/content/ServicePaths';
import ServiceItem from '@/components/ui/service/content/ServiceItem';

function Service() {
    const [service, setService] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleSections, setVisibleSections] = useState<number[]>([]);

    const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            if (entry.isIntersecting) {
                setVisibleSections(prev => Array.from(new Set([...prev, index])));
            } else {
                setVisibleSections(prev => prev.filter(i => i !== index));
            }
        });
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            handleIntersection,
            {
                threshold: 0.3,
                rootMargin: "-100px 0px"
            }
        );

        const elements = document.querySelectorAll('.service-section');
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [handleIntersection, service]);

    useEffect(() => {
        const unsubscribe = FetchService((newService) => {
            setService(newService);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const memoizedService = useMemo(() => service, [service]);

    if (loading) {
        return <ServiceSkeleton />;
    }

    return (
        <section className='min-h-full px-4 xl:px-10 py-6 sm:py-8'>
            <div className="container mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center justify-center mb-20 text-center"
                >
                    <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-600 to-violet-600 leading-tight'>
                        Solusi Web & Aplikasi yang Membawa Perubahan
                    </h1>
                </motion.div>

                <div className="flex flex-col gap-16 sm:gap-32 relative">
                    <div className="absolute left-[50px] top-[130px] h-[calc(100%-120px)] w-full hidden md:block z-[-1]">
                        <ServicePaths serviceLength={memoizedService.length} visibleSections={visibleSections} />
                    </div>

                    {memoizedService.map((item, index) => (
                        <ServiceItem key={item.id} item={item} index={index} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default memo(Service);
