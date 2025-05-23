import { useState, useCallback } from "react";

import { Position, DragStart } from "@/hooks/pages/project/[slug]/types/schema";

export const useImageZoom = () => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0 });

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const currentZoom = !isNaN(prev) && prev !== null ? prev : 1;
      const newZoom = Math.min(currentZoom + 0.5, 3);
      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const currentZoom = !isNaN(prev) && prev !== null ? prev : 1;
      const newZoom = Math.max(currentZoom - 0.5, 0.5);
      return newZoom;
    });
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoomLevel <= 1) return;
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [zoomLevel, position.x, position.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || zoomLevel <= 1) return;

      const bounds = {
        x: ((zoomLevel - 1) * window.innerWidth) / 2,
        y: ((zoomLevel - 1) * window.innerHeight) / 2,
      };

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setPosition({
        x: Math.max(Math.min(newX, bounds.x), -bounds.x),
        y: Math.max(Math.min(newY, bounds.y), -bounds.y),
      });
    },
    [isDragging, zoomLevel, dragStart.x, dragStart.y]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (zoomLevel <= 1) return;
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    },
    [zoomLevel, position.x, position.y]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || zoomLevel <= 1) return;
      e.preventDefault();

      const bounds = {
        x: ((zoomLevel - 1) * window.innerWidth) / 2,
        y: ((zoomLevel - 1) * window.innerHeight) / 2,
      };

      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;

      setPosition({
        x: Math.max(Math.min(newX, bounds.x), -bounds.x),
        y: Math.max(Math.min(newY, bounds.y), -bounds.y),
      });
    },
    [isDragging, zoomLevel, dragStart.x, dragStart.y]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  return {
    zoomLevel,
    position,
    isDragging,
    handleZoomIn,
    handleZoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetZoom,
    setZoomLevel,
  };
};
