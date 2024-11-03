const KEY = import.meta.env.VITE_RECAPTCHA_SECRET_KEY;

export async function getRecaptchaScore(token: string): Promise<boolean> {
    let responseData;

    try {
        const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                secret: KEY,
                response: token,
            })
        });

        responseData = await res.json();
    } catch (e) {
        console.log("recaptcha error:", e);
    }

    if (responseData && responseData.success && responseData.score > 0.5) {
        return true;
    } else {
        return false;
    }
}
