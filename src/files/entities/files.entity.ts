import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("files")
export class FileEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  roomId: string; //this is refCode in booking

  @Column({ nullable: true })
  userTell: string;

  @Column({ nullable: true })
  originalName: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  s3Key: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  typeslip: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
