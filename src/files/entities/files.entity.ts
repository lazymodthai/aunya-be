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

  @Column()
  bookingId: string;

  @Column()
  userTell: string;

  @Column()
  originalName: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  s3Key: string;

  @Column()
  mimeType: string;

  @Column()
  fileSize: number;

  @Column()
  typeslip: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
