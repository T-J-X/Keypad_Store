'use client';

import { useMemo, useState } from 'react';
import { STITCH_HOME_DATA, type StitchHomeData } from '../../data/stitchMockData';

export interface UseStitchLandingDataResult {
  readonly data: StitchHomeData;
  readonly activeBottomNav: string;
  readonly setActiveBottomNav: (id: string) => void;
}

export function useStitchLandingData(): UseStitchLandingDataResult {
  const [activeBottomNav, setActiveBottomNav] = useState('home');
  const data = useMemo(() => STITCH_HOME_DATA, []);

  return {
    data,
    activeBottomNav,
    setActiveBottomNav,
  };
}
