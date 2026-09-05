import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';

const normalizeObjectLiteral = (value) => {
  if (!value || typeof value !== 'string') return null;

  try {
    const withQuotedKeys = value.replace(/([{,]\s*)([a-zA-Z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
    return JSON.parse(withQuotedKeys);
  } catch {
    const keyMatch = value.match(/(?:^|[\s,{])(en|de|ar|label|name|title|text|message)\s*:\s*("([^"]*)"|'([^']*)')/i);
    if (keyMatch) {
      const key = keyMatch[1];
      const extractedValue = keyMatch[3] ?? keyMatch[4] ?? '';
      return { [key]: extractedValue };
    }

    const firstQuotedValue = value.match(/"([^"]*)"|'([^']*)'/);
    if (firstQuotedValue) {
      return { en: firstQuotedValue[1] ?? firstQuotedValue[2] ?? '' };
    }

    return null;
  }
};

const sanitizeLocalizedObjectLiterals = (text) => {
  if (typeof text !== 'string' || !text.includes('{')) return text || '';

  return text.replace(/\{[^{}]*\}/g, (match) => {
    const parsed = normalizeObjectLiteral(match);
    if (!parsed || typeof parsed !== 'object') return match;

    const resolved = normalizeToastText(parsed);
    return resolved || match;
  });
};

const normalizeToastText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return sanitizeLocalizedObjectLiterals(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value
      .map(item => normalizeToastText(item))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    const prioritizedKeys = ['en', 'de', 'ar', 'label', 'name', 'title', 'text', 'message'];

    for (const key of prioritizedKeys) {
      const candidate = normalizeToastText(value?.[key]);
      if (candidate) return candidate;
    }

    const firstValue = Object.values(value).find(item => item !== null && item !== undefined);
    return normalizeToastText(firstValue);
  }

  return '';
};

export const toastConfig = {
  topSuccess: ({ text1 = '', text2 = '', props = {} } = {}) => {
    const title = normalizeToastText(text1);
    const message = normalizeToastText(text2);

    return (
      <View style={styles.container}>
        {props?.showLoader !== false && (
          <ActivityIndicator size="small" color="#ed1c24" style={styles.loader} />
        )}
        <View style={styles.textWrap}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => Toast.hide()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  },
  success: ({ text1 = '', text2 = '', props = {} } = {}) => {
    const title = normalizeToastText(text1);
    const message = normalizeToastText(text2);

    return (
      <View style={styles.container}>
        {props?.showLoader !== false && (
          <ActivityIndicator size="small" color="#ed1c24" style={styles.loader} />
        )}
        <View style={styles.textWrap}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => Toast.hide()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  },
  topError: ({ text1 = '', text2 = '' } = {}) => {
    const title = normalizeToastText(text1);
    const message = normalizeToastText(text2);

    return (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.textWrap}>
          {!!title && (
            <Text style={[styles.title, styles.errorTitle]}>{title}</Text>
          )}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => Toast.hide()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  },
  error: ({ text1 = '', text2 = '' } = {}) => {
    const title = normalizeToastText(text1);
    const message = normalizeToastText(text2);

    return (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.textWrap}>
          {!!title && (
            <Text style={[styles.title, styles.errorTitle]}>{title}</Text>
          )}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => Toast.hide()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  },
  info: ({ text1 = '', text2 = '' } = {}) => {
    const title = normalizeToastText(text1);
    const message = normalizeToastText(text2);

    return (
      <View style={styles.container}>
        <View style={styles.textWrap}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => Toast.hide()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  },
};

export default toastConfig;

const styles = StyleSheet.create({
  container: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  textWrap: {
    flex: 1,
    paddingRight: 10,
  },
  loader: {
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  message: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    borderColor: '#FCA5A5',
  },
  errorTitle: {
    color: '#B91C1C',
  },
});
