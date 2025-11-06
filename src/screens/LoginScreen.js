import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signup, login, isNicknameAvailable } = useAuth();

  const handleSubmit = () => {
    // 유효성 검사
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    if (nickname.trim().length < 2) {
      Alert.alert('알림', '닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }

    if (!password) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return;
    }

    if (password.length < 4) {
      Alert.alert('알림', '비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (isSignup) {
      // 회원가입
      if (password !== confirmPassword) {
        Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
        return;
      }

      // 닉네임 중복 체크
      if (!isNicknameAvailable(nickname.trim())) {
        Alert.alert('알림', '이미 사용 중인 닉네임입니다.\n다른 닉네임을 선택해주세요.');
        return;
      }

      const result = signup(nickname.trim(), password);
      if (!result.success) {
        Alert.alert('회원가입 실패', result.error);
      }
    } else {
      // 로그인
      const result = login(nickname.trim(), password);
      if (!result.success) {
        Alert.alert('로그인 실패', result.error);
      }
    }
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    setNickname('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* 로고 */}
        <View style={styles.logoContainer}>
          <Ionicons name="paw" size={64} color="#FF6B6B" />
          <Text style={styles.title}>Pet Photos</Text>
          <Text style={styles.subtitle}>
            {isSignup ? '계정 만들기' : '어서오세요!'}
          </Text>
        </View>

        {/* 폼 */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="닉네임"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {isSignup && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          )}

          {isSignup && (
            <Text style={styles.helperText}>
              * 닉네임과 비밀번호만으로 시작할 수 있어요!{'\n'}
              * 개인정보는 수집하지 않습니다.
            </Text>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {isSignup ? '시작하기' : '로그인'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={switchMode} style={styles.switchButton}>
            <Text style={styles.switchButtonText}>
              {isSignup ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 가입하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
});
