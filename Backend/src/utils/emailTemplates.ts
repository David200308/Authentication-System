export const activationEmail = (link: string) => {
    return `
        <h1>
            Please click the link to activate your account!
        </h1>
        <a href="${link}">${link}</a>
    `;
}
