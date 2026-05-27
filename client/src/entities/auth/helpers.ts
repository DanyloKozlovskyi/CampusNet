import { setCookie } from "@shared/api";

const saveTokens = ({
  token,
  refreshToken,
}: {
  token: string;
  refreshToken: string;
}) => {
  setCookie("access_token", `Bearer ${token}`);
  setCookie("refresh_token", `Bearer ${refreshToken}`);
};

const clearTokens = () => {
  setCookie("access_token", "", -1);
  setCookie("refresh_token", "", -1);
  setCookie("user_email", "", -1);
};

export { saveTokens, clearTokens };
