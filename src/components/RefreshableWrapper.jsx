import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { COLORS } from '../theme/colors';

export const RefreshableWrapper = ({ 
  children, 
  onRefresh, 
  colors = [COLORS.primary],
  tintColor = COLORS.primary,
  ...scrollViewProps 
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      {...scrollViewProps}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={colors}
          tintColor={tintColor}
        />
      }
    >
      {children}
    </ScrollView>
  );
};

export const useRefreshControl = (onRefresh, colors = [COLORS.primary]) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
};

export default RefreshableWrapper;

