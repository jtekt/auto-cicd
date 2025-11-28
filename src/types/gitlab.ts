export type GitlabGraphqlResponse<T> = {
    data: T;
    errors?: { message: string }[];
}