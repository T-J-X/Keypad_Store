'use client';

import { use, useCallback, useEffect, useMemo, useReducer } from 'react';
import useSWR from 'swr';
import { KeypadContext } from '../KeypadProvider';
import type { SavedConfigurationItem } from '../types';
import {
  createInitialSavedDesignsModalUiState,
  type AuthMode,
  type SavedDesignsModalUiState,
} from './types';
import { savedDesignsModalReducer } from './reducer';
import SavedDesignsModalView from './view';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SavedDesignsModalController() {
  const context = use(KeypadContext);
  const state = context?.state;
  const actions = context?.actions;
  const savedDesignsModalOpen = state?.savedDesignsModalOpen ?? false;
  const currentModelCode = state?.modelCode ?? '';
  const savedDesigns = state?.savedDesigns ?? [];
  const savedDesignsLoading = state?.savedDesignsLoading ?? false;
  const savedDesignsError = state?.savedDesignsError ?? null;
  const isMobile = state?.isMobile ?? false;

  const [uiState, dispatch] = useReducer(
    savedDesignsModalReducer,
    undefined,
    createInitialSavedDesignsModalUiState,
  );

  const patch = useCallback((nextPatch: Partial<SavedDesignsModalUiState>) => {
    dispatch({ type: 'patch', patch: nextPatch });
  }, []);

  const resetModalUiState = useCallback(() => {
    dispatch({ type: 'reset_modal_ui' });
  }, []);

  useEffect(() => {
    if (!savedDesignsModalOpen) return;
    resetModalUiState();
  }, [savedDesignsModalOpen, resetModalUiState]);

  const { data: sessionData, error: sessionFetchError } = useSWR(
    savedDesignsModalOpen && uiState.authState === 'checking' ? '/api/session/summary' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  useEffect(() => {
    if (savedDesignsModalOpen && uiState.authState === 'checking') {
      if (sessionData) {
        patch({ authState: sessionData.authenticated ? 'logged-in' : 'logged-out' });
      } else if (sessionFetchError) {
        patch({ authState: 'logged-out' });
      }
    }
  }, [sessionData, sessionFetchError, savedDesignsModalOpen, uiState.authState, patch]);

  const handleLogin = useCallback(async () => {
    if (!actions) return;
    if (!uiState.loginEmail.trim() || !uiState.loginPassword.trim()) {
      patch({ loginError: 'Please enter your email and password.' });
      return;
    }

    patch({ loginLoading: true, loginError: '' });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: uiState.loginEmail, password: uiState.loginPassword }),
      });

      const data = await res.json();

      if (data.success) {
        const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
        if (name) patch({ toast: `Welcome back, ${name}` });
        patch({ authState: 'logged-in' });
        actions.openSavedDesignsModal();
      } else {
        patch({ loginError: data.error || 'Login failed. Please try again.' });
      }
    } catch {
      patch({ loginError: 'Unable to connect. Please try again.' });
    } finally {
      patch({ loginLoading: false });
    }
  }, [actions, uiState.loginEmail, uiState.loginPassword, patch]);

  const handleSignup = useCallback(async () => {
    if (!actions) return;
    if (!uiState.signupFirstName.trim() || !uiState.signupLastName.trim()) {
      patch({ signupError: 'Please enter your first and last name.' });
      return;
    }
    if (!uiState.signupEmail.trim() || !uiState.signupPassword.trim()) {
      patch({ signupError: 'Please enter your email and password.' });
      return;
    }

    patch({ signupLoading: true, signupError: '' });

    try {
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: uiState.signupFirstName.trim(),
          lastName: uiState.signupLastName.trim(),
          email: uiState.signupEmail.trim(),
          password: uiState.signupPassword,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerData.success) {
        patch({ signupError: registerData.error || 'Registration failed. Please try again.' });
        return;
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: uiState.signupEmail.trim(), password: uiState.signupPassword }),
      });

      const loginData = await loginRes.json();

      if (loginData.success) {
        const name = [loginData.firstName, loginData.lastName].filter(Boolean).join(' ');
        patch({ toast: name ? `Welcome, ${name}!` : 'Account created!', authState: 'logged-in' });
        actions.openSavedDesignsModal();
      } else {
        patch({
          signupError: 'Account created! Please sign in.',
          authMode: 'login',
          loginEmail: uiState.signupEmail,
        });
      }
    } catch {
      patch({ signupError: 'Unable to connect. Please try again.' });
    } finally {
      patch({ signupLoading: false });
    }
  }, [
    actions,
    uiState.signupFirstName,
    uiState.signupLastName,
    uiState.signupEmail,
    uiState.signupPassword,
    patch,
  ]);

  const filteredDesigns = useMemo(
    () => savedDesigns.filter((item) => {
      if (uiState.activeTab === 'current' && item.keypadModel !== currentModelCode) {
        return false;
      }
      if (uiState.searchQuery.trim()) {
        const query = uiState.searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.keypadModel.toLowerCase().includes(query)
        );
      }
      return true;
    }),
    [savedDesigns, currentModelCode, uiState.activeTab, uiState.searchQuery],
  );

  const handleLoadDesign = useCallback((design: SavedConfigurationItem) => {
    if (!context) return;
    if (design.keypadModel === currentModelCode) {
      window.location.assign(
        `/configurator/keypad/${encodeURIComponent(context.meta.keypad.slug)}?load=${encodeURIComponent(design.id)}`,
      );
    } else {
      const slug = design.keypadModel.toLowerCase();
      window.location.assign(`/configurator/keypad/${slug}?load=${encodeURIComponent(design.id)}`);
    }
  }, [context, currentModelCode]);

  const switchAuthMode = useCallback((mode: AuthMode) => {
    if (mode === 'login') {
      patch({ authMode: 'login', signupError: '' });
      return;
    }
    patch({ authMode: 'signup', loginError: '' });
  }, [patch]);

  const googleRedirectTo = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/configurator';

  if (!context || !actions || !state) return null;

  return (
    <SavedDesignsModalView
      isOpen={savedDesignsModalOpen}
      authState={uiState.authState}
      authMode={uiState.authMode}
      loginEmail={uiState.loginEmail}
      loginPassword={uiState.loginPassword}
      loginError={uiState.loginError}
      loginLoading={uiState.loginLoading}
      signupFirstName={uiState.signupFirstName}
      signupLastName={uiState.signupLastName}
      signupEmail={uiState.signupEmail}
      signupPassword={uiState.signupPassword}
      signupError={uiState.signupError}
      signupLoading={uiState.signupLoading}
      activeTab={uiState.activeTab}
      searchQuery={uiState.searchQuery}
      savedDesignsLoading={savedDesignsLoading}
      savedDesignsError={savedDesignsError}
      filteredDesigns={filteredDesigns}
      currentModelCode={currentModelCode}
      isMobile={isMobile}
      toast={uiState.toast}
      googleRedirectTo={googleRedirectTo}
      onClose={actions.closeSavedDesignsModal}
      onSwitchAuthMode={switchAuthMode}
      onLoginEmailChange={(value) => patch({ loginEmail: value })}
      onLoginPasswordChange={(value) => patch({ loginPassword: value })}
      onSignupFirstNameChange={(value) => patch({ signupFirstName: value })}
      onSignupLastNameChange={(value) => patch({ signupLastName: value })}
      onSignupEmailChange={(value) => patch({ signupEmail: value })}
      onSignupPasswordChange={(value) => patch({ signupPassword: value })}
      onLogin={() => void handleLogin()}
      onSignup={() => void handleSignup()}
      onSetActiveTab={(tab) => patch({ activeTab: tab })}
      onSearchQueryChange={(value) => patch({ searchQuery: value })}
      onLoadDesign={handleLoadDesign}
      onDismissToast={() => patch({ toast: null })}
    />
  );
}
