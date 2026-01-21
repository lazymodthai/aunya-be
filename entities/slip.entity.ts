import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("slips")
export class SlipEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  referenceId: string;

  @Column({ type: "varchar", length: 255 })
  decode: string;

  @Column({ type: "varchar", length: 255 })
  transRef: string;

  @Column({ type: "varchar", length: 255 })
  dateTime: string;

  @Column({ type: "varchar", length: 255 })
  amount: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ref1: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ref2: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ref3: string;

  @Column({ type: "jsonb", nullable: true })
  receiver: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  sender: Record<string, any>;
  @Column({ type: "varchar", length: 25 })
  typeslip: string;

  @CreateDateColumn({type:"timestamp with time zone",default:"now()"})

  createdAt: Date;
}
