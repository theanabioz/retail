import WebApp from '@twa-dev/sdk';

export const useTelegram = () => {
  const onToggleButton = () => {
    if (WebApp?.MainButton?.isVisible) {
      WebApp.MainButton.hide();
    } else {
      WebApp?.MainButton?.show();
    }
  };

  const onExpand = () => {
    if (WebApp?.expand) {
      WebApp.expand();
    }
  };

  const onReady = () => {
    if (WebApp?.ready) {
      WebApp.ready();
    }
  };

  return {
    onToggleButton,
    onExpand,
    onReady,
    tg: WebApp,
    user: WebApp?.initDataUnsafe?.user,
    queryId: WebApp?.initDataUnsafe?.query_id,
  };
};
