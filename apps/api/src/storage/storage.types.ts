export interface StoredObject {
  key: string;
  url: string;
}

export interface ObjectStorage {
  putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<StoredObject>;
}
