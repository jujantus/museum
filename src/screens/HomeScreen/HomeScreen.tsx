import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  ReactElement,
} from 'react';
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { useAppSelector } from '@/core';
import {
  NavigationProps,
  routeNames,
  useNavigation,
  useSafeAreaInsets,
} from '@/navigation';
import { colors, sizes } from '@/styles';
import {
  AppText,
  Arrow,
  EventsCarrousel,
  SectionTitle,
  SeparateChildren,
} from '@/components';
import { useSpring } from '@/hooks/useSpring';
import { Artwork } from '@/core/museum/types';
import { useActions } from './useActions';
import { NotificationsIcon } from './NotificationsIcon';

const keyExtractor = (item: Artwork, index: number) => `${item?.id}-${index}`;

const _renderItem = ({
  item,
  onSelect,
}: {
  item?: Artwork;
  onSelect: () => void;
}) => {
  if (!item) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{
        marginVertical: 20,
        marginHorizontal: sizes.contentMargin.full,
      }}>
      <View
        style={{
          width: sizes.deviceWidth * 0.8,
          alignSelf: 'center',
          backgroundColor: item.color
            ? `hsl(${item.color.h}, ${item.color.s}%, ${item.color.l}%)`
            : colors.primary,
          justifyContent: 'center',
        }}>
        <View
          style={{
            flex: 0,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5,
          }}>
          {item?.thumbnail && (
            <Image
              resizeMode="contain"
              style={{
                width: '90%',
                alignSelf: 'center',
                marginVertical: 10,
                alignItems: 'center',
                aspectRatio: item?.thumbnail?.width / item?.thumbnail?.height,
              }}
              source={{
                uri: `https://www.artic.edu/iiif/2/${item.image_id}/full/200,/0/default.jpg`,
              }}
            />
          )}
        </View>
      </View>
      <View
        style={{
          paddingVertical: 10,
          marginHorizontal: sizes.contentMargin.full,
        }}>
        <SeparateChildren Separator={() => <View style={{ height: 5 }} />}>
          <AppText.Subtitle2
            style={{
              color: colors.alphaColor(colors.black, 0.8),
            }}>
            {item.title}
          </AppText.Subtitle2>
          <AppText.Body1>
            {item.artist_title}
            {item.artist_title && item.fiscal_year && '  |  '}
            {item.fiscal_year && (
              <AppText.Overline2>{item.fiscal_year}</AppText.Overline2>
            )}
          </AppText.Body1>
        </SeparateChildren>
      </View>
    </TouchableOpacity>
  );
};

export function HomeScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const flatListRef = useRef<FlatList>(null);

  const [isActive, setIsActive] = useState<boolean>(false);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { handleGetEvents, handleGetArtworks } = useActions();

  const { artworks = [] } = useAppSelector(state => state.museum);

  const animate = useSpring(
    { to: isActive ? 1 : 0 },
    {
      stiffness: 50,
    },
  );

  const opacity = animate.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  }) as unknown as number;

  const translateYContent = animate.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -250],
  }) as unknown as number;

  useEffect(() => {
    handleGetEvents();
    handleGetArtworks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      if (e.nativeEvent.contentOffset.y <= 0 && isActive === true) {
        setIsActive(false);
      } else if (e.nativeEvent.contentOffset.y > 0 && isActive === false) {
        setIsActive(true);
      }
    },
    [isActive],
  );

  const handleEndReached = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await handleGetArtworks();
    } finally {
      setIsRefreshing(false);
    }
  }, [handleGetArtworks]);

  const handleRefreshPull = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await handleGetArtworks(1);
    } finally {
      setIsRefreshing(false);
    }
  }, [handleGetArtworks]);

  const handleSelectArtwork = useCallback(
    (artwork: Artwork) =>
      navigation.navigate(routeNames.SINGLE_ARTWORK, { id: artwork.id }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Artwork }) =>
      _renderItem({
        item,
        onSelect: () => {
          handleSelectArtwork(item);
        },
      }),
    [handleSelectArtwork],
  );

  const renderHeader = useCallback(
    () => (
      <View style={{ marginTop: insets.top + 10 }}>
        <SectionTitle title="Events" />
        <EventsCarrousel />
        <SectionTitle title="Artworks" />
      </View>
    ),
    [insets.top],
  );

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={[
          {
            zIndex: 1,
            position: 'absolute',
            width: '100%',
            alignSelf: 'center',
            paddingHorizontal: sizes.contentMargin.full,
            top: 0,
            paddingTop: insets.top,
            marginTop: 20,
            marginHorizontal: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
          },
          { transform: [{ translateY: translateYContent }] },
        ]}>
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.silver,
            borderRadius: sizes.borderRadius.medium,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <NotificationsIcon color={colors.alphaColor(colors.primary, 0.5)} />
        </View>
        <Image
          source={require('./articLogo.png')}
          style={{ width: 70, height: 70 }}
        />
      </Animated.View>
      <FlatList
        ref={flatListRef}
        data={artworks}
        onScroll={handleScroll}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader()}
        onEndReachedThreshold={0.1}
        contentContainerStyle={{ flexGrow: 1 }}
        onEndReached={handleEndReached}
        ItemSeparatorComponent={() =>
          (
            <View
              style={{
                width: '60%',
                alignSelf: 'center',
                marginBottom: 20,
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.alphaColor(colors.primaryDark, 0.5),
              }}
            />
          ) as ReactElement
        }
        refreshControl={Platform.select({
          ios: (
            <RefreshControl
              tintColor={colors.primary}
              refreshing={isRefreshing}
              onRefresh={handleRefreshPull}
            />
          ),
          android: (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefreshPull}
              progressBackgroundColor={colors.primary}
              colors={[colors.primary, colors.primaryDark, colors.primaryLight]}
            />
          ),
        })}
      />
      <TouchableOpacity
        onPress={() =>
          flatListRef.current?.scrollToOffset({ animated: true, offset: -100 })
        }>
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: 20,
              right: 10,
              bottom: insets.bottom + 10,
              backgroundColor: colors.alphaColor(colors.primary, 0.9),
              justifyContent: 'center',
              alignItems: 'center',
            },
            { opacity },
          ]}>
          <Arrow direction="up" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
