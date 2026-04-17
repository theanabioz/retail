import WebApp from '@twa-dev/sdk';

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: typeof WebApp;
  };
};

export const useTelegram = () => {
  const tg = (window as TelegramWindow).Telegram?.WebApp ?? WebApp;

  const onToggleButton = () => {
    if (tg?.MainButton?.isVisible) {
      tg.MainButton.hide();
    } else {
      tg?.MainButton?.show();
    }
  };

  const onExpand = () => {
    if (tg?.expand) {
      tg.expand();
    }
  };

  const onReady = () => {
    if (tg?.ready) {
      tg.ready();
    }
  };

  return {
    onToggleButton,
    onExpand,
    onReady,
    tg,
    user: tg?.initDataUnsafe?.user,
    queryId: tg?.initDataUnsafe?.query_id,
  };
};
