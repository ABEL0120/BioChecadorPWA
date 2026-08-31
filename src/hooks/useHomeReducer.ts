import { useReducer } from "react";
import { EstadoEmpleadoDto, RegistroChecadaResponseDto } from "../types/api";
import { GpsLocationResult } from "../services/locationService";

export interface HomeState {
  rfc: string;
  loading: boolean;
  enrolling: boolean;
  marking: boolean;
  showReenrollButton: boolean;
  fetchingGps: boolean;
  hasPendingOffline: boolean;
  userLocation: GpsLocationResult | null;
  registroResult: RegistroChecadaResponseDto | null;
  errorMsg: string | null;
  biometricAvailable: boolean;
  toastState: {
    show: boolean;
    message: string;
    color: "success" | "danger" | "warning" | "primary";
  };
  alertState: {
    show: boolean;
    title: string;
    message: string;
  };
}

export const initialState: HomeState = {
  rfc: "",
  loading: false,
  enrolling: false,
  marking: false,
  showReenrollButton: false,
  fetchingGps: false,
  hasPendingOffline: false,
  userLocation: null,
  registroResult: null,
  errorMsg: null,
  biometricAvailable: false,
  toastState: { show: false, message: "", color: "success" },
  alertState: { show: false, title: "", message: "" },
};

type Action =
  | { type: "SET_STATE"; payload: Partial<HomeState> }
  | { type: "RESET_SEARCH" }
  | { type: "SHOW_ALERT"; payload: { title: string; message: string } }
  | {
      type: "SHOW_TOAST";
      payload: { message: string; color: "success" | "danger" | "warning" | "primary" };
    };

export const homeReducer = (state: HomeState, action: Action): HomeState => {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "RESET_SEARCH":
      return {
        ...state,
        rfc: "",
        registroResult: null,
        errorMsg: null,
        userLocation: null,
        showReenrollButton: false,
      };
    case "SHOW_ALERT":
      return {
        ...state,
        alertState: {
          show: true,
          title: action.payload.title,
          message: action.payload.message,
        },
      };
    case "SHOW_TOAST":
      return {
        ...state,
        toastState: {
          show: true,
          message: action.payload.message,
          color: action.payload.color,
        },
      };
    default:
      return state;
  }
};
