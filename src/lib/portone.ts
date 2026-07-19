import * as PortOne from "@portone/browser-sdk/v2";
import type { PaymentPrepareResponse } from "../api/payment";

/**
 * 포트원(PortOne) V2 브라우저 SDK 호출을 감싸는 얇은 어댑터.
 *
 * SDK 호출을 페이지에 직접 두지 않고 여기로 모은 이유는, 결제창 결과가
 * "예외"가 아니라 "응답 객체의 code 필드"로 온다는 규칙이 SDK 특유의 것이기 때문이다.
 * 그 처리를 페이지마다 반복하면 실수로 실패를 성공으로 넘기기 쉽다.
 */

/** 결제창 종료 결과. 성공이면 paymentId 로 서버에 완료 확인을 요청한다. */
export type PortOneResult =
  | { ok: true; paymentId: string; txId?: string }
  | { ok: false; message: string; cancelled: boolean };

/**
 * 사용자가 결제창을 직접 닫았을 때 포트원이 주는 코드.
 * 이건 오류가 아니라 정상적인 취소이므로 화면에 빨간 에러를 띄우지 않는다.
 */
const USER_CANCEL_CODES = ["FAILURE_TYPE_PG_CANCEL", "USER_CANCEL", "PAY_PROCESS_CANCELED"];

/**
 * 결제창을 띄우고 결과를 기다린다.
 *
 * PC 에서는 팝업/iframe 으로 떠서 이 Promise 가 결과와 함께 resolve 되고,
 * 모바일에서는 결제 앱으로 이동했다가 redirectUrl 로 되돌아온다(이 Promise 는 끝나지 않는다).
 * 그래서 돌아올 페이지(/payment/complete)가 따로 필요하다.
 *
 * @param prepared 서버 /v1/payments/prepare 응답. 금액·채널·주문명 모두 서버가 정한 값이다.
 * @param redirectUrl 모바일에서 결제 후 돌아올 절대 URL
 */
export async function requestPortOnePayment(
  prepared: PaymentPrepareResponse,
  redirectUrl: string
): Promise<PortOneResult> {
  // SDK 타입은 문자열 리터럴 유니온이라 서버가 준 string 을 그대로 넣을 수 없다.
  // 값 자체는 서버가 포트원 규격에 맞춰 내려주므로 여기서는 타입만 통과시킨다.
  const request: any = {
    storeId: prepared.storeId,
    channelKey: prepared.channelKey,
    paymentId: prepared.paymentId,
    orderName: prepared.orderName,
    totalAmount: prepared.totalAmount,
    currency: prepared.currency,
    payMethod: prepared.payMethod,
    redirectUrl,
    customer: {
      fullName: prepared.customerName,
      phoneNumber: prepared.customerPhone,
      email: prepared.customerEmail ?? undefined,
    },
  };

  // 간편결제는 어느 사업자인지까지 알려줘야 결제창이 해당 앱으로 바로 연결된다.
  if (prepared.easyPayProvider) {
    request.easyPay = { easyPayProvider: prepared.easyPayProvider };
  }

  try {
    const response = await PortOne.requestPayment(request);

    // SDK 는 실패해도 throw 하지 않는다. code 가 있으면 실패다.
    if (response?.code) {
      return {
        ok: false,
        message: response.message ?? "결제가 완료되지 않았습니다.",
        cancelled: USER_CANCEL_CODES.includes(response.code),
      };
    }

    // 정상 종료인데 paymentId 가 없으면 뒤이을 서버 확인을 할 수 없다.
    // 우리가 넘긴 값으로 대체해 결제 확정 기회를 잃지 않게 한다.
    return {
      ok: true,
      paymentId: response?.paymentId ?? prepared.paymentId,
      txId: response?.txId,
    };
  } catch (e: any) {
    // 네트워크 차단, 팝업 차단 등 SDK 가 실제로 예외를 던지는 경우
    return {
      ok: false,
      message: e?.message ?? "결제창을 여는 데 실패했습니다.",
      cancelled: false,
    };
  }
}
