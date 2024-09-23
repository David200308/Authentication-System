export type User = {
    id: number;
    username: string;
    email: string;
    password?: string;
    createAt: Date;
    updateAt: Date;
}

export type SignUpSchema = {
    username: string;
    email: string;
    password?: string;
}

export type SignInSchema = {
    email: string;
    password: string;
}

export type ReturnUserSchema = {
    id: number;
    username: string;
    email: string;
    createAt: Date;
    updateAt: Date;
}
