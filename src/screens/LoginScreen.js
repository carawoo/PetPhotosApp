import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotNickname, setForgotNickname] = useState('');
  const [foundPassword, setFoundPassword] = useState('');
  const { signup, login, isNicknameAvailable } = useAuth();

  const handleSubmit = async () => {
    // 에러 메시지 초기화
    setErrorMessage('');

    // 유효성 검사
    if (!nickname.trim()) {
      setErrorMessage('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.trim().length < 2) {
      setErrorMessage('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }

    if (!password) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }

    if (password.length < 4) {
      setErrorMessage('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (isSignup) {
      // 회원가입
      if (password !== confirmPassword) {
        setErrorMessage('비밀번호가 일치하지 않습니다.');
        return;
      }

      if (!contactInfo.trim()) {
        setErrorMessage('연락처를 입력해주세요.\n비밀번호 재설정 시 사용됩니다.');
        return;
      }

      // 닉네임 중복 체크
      const available = await isNicknameAvailable(nickname.trim());
      if (!available) {
        setErrorMessage('이미 사용 중인 닉네임입니다.\n다른 닉네임을 선택해주세요.');
        return;
      }

      const result = await signup(nickname.trim(), password, autoLogin, contactInfo.trim());
      if (!result.success) {
        setErrorMessage(result.error);
      }
    } else {
      // 로그인
      const result = await login(nickname.trim(), password, autoLogin);
      if (!result.success) {
        setErrorMessage(result.error);
      }
    }
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    setNickname('');
    setPassword('');
    setConfirmPassword('');
    setContactInfo('');
    setErrorMessage('');
  };

  const handleForgotPassword = async () => {
    if (!forgotNickname.trim()) {
      if (Platform.OS === 'web') {
        alert('닉네임을 입력해주세요.');
      } else {
        Alert.alert('알림', '닉네임을 입력해주세요.');
      }
      return;
    }

    // 보안상 이유로 자동 비밀번호 찾기 제거 - 관리자 연락 필요
    setFoundPassword('confirmed');
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotNickname('');
    setFoundPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* 로고 */}
        <View style={styles.logoContainer}>
          <Ionicons name="paw" size={72} color="#FF3366" />
          <Text style={styles.title}>Peto</Text>
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
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="연락처 (이메일 또는 전화번호)"
                value={contactInfo}
                onChangeText={setContactInfo}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
          )}

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#FF3366" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isSignup && (
            <Text style={styles.helperText}>
              * 연락처는 비밀번호 재설정 시에만 사용됩니다.{'\n'}
              * 이메일 또는 전화번호를 입력해주세요.{'\n'}
              * 관리자가 직접 확인하여 안내드립니다.
            </Text>
          )}

          {/* 자동 로그인 체크박스 */}
          <TouchableOpacity
            style={styles.autoLoginContainer}
            onPress={() => setAutoLogin(!autoLogin)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, autoLogin && styles.checkboxChecked]}>
              {autoLogin && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.autoLoginText}>자동 로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {isSignup ? '시작하기' : '로그인'}
            </Text>
          </TouchableOpacity>

          {!isSignup && (
            <TouchableOpacity
              onPress={() => setShowForgotPassword(true)}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={switchMode} style={styles.switchButton}>
            <Text style={styles.switchButtonText}>
              {isSignup ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 가입하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 비밀번호 찾기 모달 */}
      <Modal
        visible={showForgotPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={closeForgotPassword}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>비밀번호 찾기</Text>
              <TouchableOpacity onPress={closeForgotPassword}>
                <Ionicons name="close" size={28} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              보안상 자동 비밀번호 찾기는 제공하지 않습니다.{'\n'}
              아래 관리자 이메일로 연락 주시면{'\n'}
              회원가입 시 등록한 연락처로 재설정을 도와드립니다.
            </Text>

            <View style={styles.adminEmailContainer}>
              <Ionicons name="mail-outline" size={20} color="#FF3366" />
              <Text style={styles.adminEmail}>carawoo96@gmail.com</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="관리자에게 전달할 닉네임 입력"
                value={forgotNickname}
                onChangeText={setForgotNickname}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {foundPassword ? (
              <View style={styles.passwordFoundContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                <Text style={styles.passwordFoundText}>
                  위 이메일로 다음 정보를 보내주세요:{'\n'}
                  • 닉네임: <Text style={styles.passwordValue}>{forgotNickname}</Text>{'\n'}
                  • 가입 시 등록한 연락처{'\n'}
                  관리자가 확인 후 재설정을 도와드립니다.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.modalButtonText}>안내 확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 20,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 10,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeIcon: {
    padding: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  submitButton: {
    backgroundColor: '#FF3366',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    color: '#FF3366',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0E7',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3366',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  autoLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#FF3366',
    borderColor: '#FF3366',
  },
  autoLoginText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  forgotPasswordText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalDescription: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 22,
  },
  adminEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0E7',
    gap: 10,
  },
  adminEmail: {
    fontSize: 16,
    color: '#FF3366',
    fontWeight: '600',
  },
  passwordFoundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
    gap: 10,
  },
  passwordFoundText: {
    flex: 1,
    fontSize: 15,
    color: '#166534',
    fontWeight: '500',
  },
  passwordValue: {
    fontWeight: '700',
    color: '#15803D',
  },
  modalButton: {
    backgroundColor: '#FF3366',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
