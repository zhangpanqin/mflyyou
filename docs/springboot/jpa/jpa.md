---
title: Spring Data Jpa
---

## 前言

目前在做的项目使用的是 Spring Data Jpa，以前都是使用 Mybatis ，前段时间研究了 JPA 的使用。

本文例子全部在 [https://github.com/zhangpanqin/jpa-study](https://github.com/zhangpanqin/jpa-study) ,数据库使用的是内存数据库 H2。

## JPA

### 认识 JPA

`JPA` 是 `Java Persistence API` 的简称，定义了 Java 对象与数据库表的映射关系，以及定义运行时期怎么 CRUD 的接口规范。

`Hibernate` 提供了 JPA 的实现。除此之外还有别的实现，比如 Open Jpa 等等。

Spring Data 为数据访问提供了一个熟悉且一致的，基于 Spring 的编程模型，同时仍保留基础数据存储的特殊特征。

-   Spring Data JPA 用于操作关系型数据库

-   Spring Data MongoDB 用于操作 MongoDB
-   Spring Data Elasticsearch 用于操作 Es
-   Spring Data Redis 用于操作 Redis

`Spring Data JPA` 底层的 JPA 实现采用的是 `Hibernate` ，也可以说是封装了 `Hibernate`，提供了 Spring 统一的编程模型。

统一的编程模型是指：下面这段代码，可以操作 JPA，ES，Redis 等等，只是 Person 上的注解不一样。

又可以通过更换 CrudRepository 接口，提供更细粒度的不同数据库的数据控制。

```java
public interface PersonRepository extends CrudRepository<Person, Long> {

  List<Person> findByLastname(String lastname);

  List<Person> findByFirstnameLike(String firstname);
}
```

### JPA 常用注解介绍

<font color=red>使用 JPA 的时候不要使用数据库的外键，一是影响性能，二是不利于更换数据库。</font>

<font color=red>不要使用  `Hibernate`  生成表结构，使用 flyway 组件，通过 SQL 来控制数据库表、索引，字段管理，flyway 灵活性更强</font>

```java
@Data
@Entity
@Table(name = "sys_user")
public class SysUserEntity extends BaseEntity {

    private String nickname;

    private Integer age;

    /**
     * name 定义的是关联表字段,referencedColumnName 是当前表中的主键字段
     */
    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = USER_ID,referencedColumnName = ID,foreignKey =@ForeignKey(NO_CONSTRAINT) )
    private List<SysBlogEntity> sysBlogEntities;
}
```

#### @Entity

标记该类是一个 Entity ,被 JPA 管理

#### @Table

指定 Entity 与数据库中的那个表映射

#### @JoinColumn

指定了两个关联表之间使用哪两个字段关联

#### @Column

指定了 Entity 字段与表的那个字段关联

#### @Id

指定主键字段

#### @GeneratedValue

指定主键的生成策略，下文详细介绍

#### @Transient

忽略字段与表字段的映射关系

#### @OneToMany

一对多关系指定，当前 Entity 与另一个 Entity 的映射关系。

```java
/**
  * name 定义的是关联表字段,referencedColumnName 是当前表中的主键字段
  */
@OneToMany(fetch = FetchType.EAGER)
@JoinColumn(name = USER_ID,referencedColumnName = ID,foreignKey =@ForeignKey(NO_CONSTRAINT) )
private List<SysBlogEntity> sysBlogEntities;
```

#### @ManyToOne

参考 OneToMany

#### @ManyToMany

```java
/**
  * @JoinTable 指定中间表,及中间表中的字段映射
  * @JoinColumn(name = ROLE_ID,referencedColumnName = ID) 指定了中间表的字段(name) 和另一个表那个字段关联(referencedColumnName)
  */
@ManyToMany
@JoinTable(name = SYS_USER_ROLE, joinColumns = {@JoinColumn(name = USER_ID, referencedColumnName = ID)},
           inverseJoinColumns = {@JoinColumn(name = ROLE_ID,referencedColumnName = ID)})
private List<SysRoleEntity> sysRoleEntities;
```

#### @OneToOne

```java
@OneToOne(optional=false)
@JoinColumn(name="CUSTREC_ID", unique=true, nullable=false, updatable=false)
private CustomerRecord customerRecord;
```

#### @Query

可以写 SQL 操作数据库

```java
public interface SysBlogRepository extends JpaRepository<SysBlogEntity,Long> {
    @Query(nativeQuery = true,value = "select  * from sys_blog where user_id = :userId")
    List<SysBlogEntity> findByUserId(Long userId);

    @Query(nativeQuery = true ,value = "select  * from sys_blog where title = :#{#sysBlogDTO.title}")
    List<SysBlogEntity> findByTitle(@Param("sysBlogDTO") SysBlogDTO sysBlogDTO);
}
```

#### 主键生成策略

```java
/**
 * strategy 取值
 *
 * AUTO 由程序控制，默认策略。Oracle 默认是 SEQUENCE，Mysql默认是 IDENTITY
 *
 * IDENTITY： 主键自增长，需要在表中定义表字段自增长，Mysql ，PostgreSQL，SQL Server 可以采用）
 *
 * SEQUENCE：使用序列作为主键 ，Oracle、PostgreSQL、DB2 可以使用
 * @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "emailSeq")
 * @SequenceGenerator(initialValue = 1, name = "emailSeq", sequenceName = "EMAIL_SEQUENCE")
 * private long id;
 * 然后再数据库创建一个序列 create sequence EMAIL_SEQUENCE;
 * 当不在 SequenceGenerator 指定 sequenceName ，默认使用 Hibernate 提供的序列名称为 hibernate_sequence
 *
 * TABLE 一般不适用这一个
 */
public @interface GeneratedValue {
    GenerationType strategy() default AUTO;
    String generator() default "";
}
```

#### 主键生成策略例子

```java
@Data
@Table
@Entity
public class KeyGeneratorEntity {
    @Id
    @GeneratedValue(generator = "system-uuid")
    @GenericGenerator(name = "system-uuid",strategy = "uuid")
    private String id;

    private String username;
}

@SpringBootTest
class KeyGeneratorRepositoryTest {

    @Autowired
    private KeyGeneratorRepository keyGeneratorRepository;

    @Test
    public void run(){
        final KeyGeneratorEntity keyGeneratorEntity = new KeyGeneratorEntity();
        keyGeneratorEntity.setUsername(LocalDateTime.now().toString());
        keyGeneratorRepository.save(keyGeneratorEntity);

        final List<KeyGeneratorEntity> all = keyGeneratorRepository.findAll();
        // [KeyGeneratorEntity(id=ff808081796f260c01796f2616aa0000, username=2021-05-15T16:30:37.722)]
        System.out.println(all);
    }
}
```

hibernate 提供了以下主键生成策略

当 `@GeneratedValue(strategy = GenerationType.SEQUENCE)` 使用的是 `SequenceStyleGenerator.class` 控制主键生成。

当 `@GenericGenerator(name = "system-uuid",strategy = "uuid")` ，使用的是 `UUIDHexGenerator.class`

```java
public class DefaultIdentifierGeneratorFactory
		implements MutableIdentifierGeneratorFactory, Serializable, ServiceRegistryAwareService {
	private ConcurrentHashMap<String, Class> generatorStrategyToClassNameMap = new ConcurrentHashMap<String, Class>();

	@SuppressWarnings("deprecation")
	public DefaultIdentifierGeneratorFactory() {
		register( "uuid2", UUIDGenerator.class );
		register( "guid", GUIDGenerator.class );			// can be done with UUIDGenerator + strategy
		register( "uuid", UUIDHexGenerator.class );			// "deprecated" for new use
		register( "uuid.hex", UUIDHexGenerator.class ); 	// uuid.hex is deprecated
		register( "assigned", Assigned.class );
		register( "identity", IdentityGenerator.class );
		register( "select", SelectGenerator.class );
		register( "sequence", SequenceStyleGenerator.class );
		register( "seqhilo", SequenceHiLoGenerator.class );
		register( "increment", IncrementGenerator.class );
		register( "foreign", ForeignGenerator.class );
		register( "sequence-identity", SequenceIdentityGenerator.class );
		register( "enhanced-sequence", SequenceStyleGenerator.class );
		register( "enhanced-table", TableGenerator.class );
	}

	public void register(String strategy, Class generatorClass) {
		LOG.debugf( "Registering IdentifierGenerator strategy [%s] -> [%s]", strategy, generatorClass.getName() );
		final Class previous = generatorStrategyToClassNameMap.put( strategy, generatorClass );
		if ( previous != null ) {
			LOG.debugf( "    - overriding [%s]", previous.getName() );
		}
	}
}
```

### Lazy 需要在一个事务内执行

```java
public class Order1 {
    @Id
    @GeneratedValue
    private Long id;
    private String description;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id",referencedColumnName = "id",foreignKey =@ForeignKey(NO_CONSTRAINT))
    private List<OrderItem> orderItemList;
}

//    @Transactional(readOnly = true)
public List<Order1> listOrder(){
    System.out.println("---------------------开始查询---------------------");
    final List<Order1> all = orderRepository.findAll();
    System.out.println("---------------------开始懒加载---------------------");
    System.out.println(JSON.toJSONString(all));
    return all;
}
```

当数据需要懒加载的时候，JPA 不会查询 `Lazy` 的数据，只有在使用的时候才会查询，但是使用的时候需要和原来的查询在同一个事务中,不然会抛出以下异常

```java
org.hibernate.LazyInitializationException: failed to lazily initialize a collection of role: com.mflyyou.jpa.n1.Order1.orderItemList, could not initialize proxy - no Session
```

由于没有开启事务，orderRepository.findAll() 执行之后这个查询事务就关闭了，所以获取 Order1.orderItemList 的时候报错。

当添加事务注解 `@Transactional` ，整个方法在一个事务内执行，就不会报错了。

### N+1 问题

```java
@Entity
@Table(name = "order1")
@Data
public class Order1 {
    @Id
    @GeneratedValue
    private Long id;
    private String description;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id",referencedColumnName = "id",foreignKey =@ForeignKey(NO_CONSTRAINT))
    private List<OrderItem> orderItemList;
}
@Transactional(readOnly = true)
public Order1 findOne(Long id){
    System.out.println("---------------------开始查询---------------------");
    final Optional<Order1> byId = orderRepository.findById(id);
    System.out.println("---------------------开始懒加载---------------------");
    System.out.println(JSON.toJSONString(byId.get()));
    return byId.get();
}
```

当查询 `Order1` 的时候，实际上不会查询 `orderItemList` ,当使用 `orderItemList` 的时候在查询一次。

当 `Order1` 有 N 个关联属性的时候，就会查询 N 次来获取对应的数据。

当数据都处于 `FetchType.LAZY` 获取数据，就会产生懒加载问题

```java
---------------------开始查询---------------------
---------------------开始查询---------------------
Hibernate:
    select
        order1x0_.id as id1_2_0_,
        order1x0_.description as descript2_2_0_
    from
        order1 order1x0_
    where
        order1x0_.id=?
---------------------开始懒加载---------------------
Hibernate:
    select
        orderiteml0_.order_id as order_id3_3_0_,
        orderiteml0_.id as id1_3_0_,
        orderiteml0_.id as id1_3_1_,
        orderiteml0_.name as name2_3_1_,
        orderiteml0_.order_id as order_id3_3_1_,
        orderiteml0_.price as price4_3_1_
    from
        order_item orderiteml0_
    where
```

```json
{
    "description": "测试2021-05-15T17:35:50.349",
    "id": 1,
    "orderItemList": [
        {
            "id": 2,
            "name": "ceshi2021-05-15T17:35:50.423",
            "orderId": 1,
            "price": 10
        },
        {
            "id": 3,
            "name": "ceshi2021-05-15T17:35:50.423",
            "orderId": 1,
            "price": 10
        },
        {
            "id": 4,
            "name": "ceshi2021-05-15T17:35:50.423",
            "orderId": 1,
            "price": 10
        },
        {
            "id": 5,
            "name": "ceshi2021-05-15T17:35:50.423",
            "orderId": 1,
            "price": 10
        },
        {
            "id": 6,
            "name": "ceshi2021-05-15T17:35:50.423",
            "orderId": 1,
            "price": 10
        }
    ]
}
```

解决办法呢，可以使用 `@OneToMany(fetch = FetchType.EAGER)` 。

查询一次获取了全部数据

```txt
Hibernate:
    select
        order1x0_.id as id1_2_0_,
        order1x0_.description as descript2_2_0_,
        orderiteml1_.order_id as order_id3_3_1_,
        orderiteml1_.id as id1_3_1_,
        orderiteml1_.id as id1_3_2_,
        orderiteml1_.name as name2_3_2_,
        orderiteml1_.order_id as order_id3_3_2_,
        orderiteml1_.price as price4_3_2_
    from
        order1 order1x0_
    left outer join
        order_item orderiteml1_
            on order1x0_.id=orderiteml1_.order_id
    where
        order1x0_.id=?
```

当出现 orderItemList 和 orderItemList2 的时候，@OneToMany(fetch = FetchType.EAGER) 会报错

```java
public class Order1 {
    @Id
    @GeneratedValue
    private Long id;
    private String description;

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id",referencedColumnName = "id",foreignKey =@ForeignKey(NO_CONSTRAINT))
    private List<OrderItem> orderItemList;

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id",referencedColumnName = "id",foreignKey =@ForeignKey(NO_CONSTRAINT))
    private List<OrderItem2> orderItemList2;
}
```

`@NamedEntityGraph` 和 `@EntityGraph` 可以解决 N+1 问题。又可以解决级联查询的时候，查询哪些成员变量，不查询哪些成员变量。让我们可以根据业务有更高的自由度查询数据。

### EntityGraph

`@NamedEntityGraph` 定义查询的时候查询哪些数据，`@EntityGraph` 用于标记 Repository 使用哪个 `NamedEntityGraph` 。

![image-20210516132930802](/blog/20210516132930.png?author=zhangpanqin)

```java
@Entity
@Table(name = "order1")
@Data
@NamedEntityGraph(name = "searchOrderGraphItem",
        attributeNodes = {
                @NamedAttributeNode(value = "orderGraphItemList", subgraph = "OrderGraphItem_productGraphs"),
        },
        subgraphs = {
                @NamedSubgraph(name = "OrderGraphItem_productGraphs", attributeNodes = {
                        @NamedAttributeNode(value = "productGraphs")
                })
        }
)
public class OrderGraph1 {
    @Id
    @GeneratedValue
    private Long id;
    private String description;

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", referencedColumnName = "id", foreignKey = @ForeignKey(NO_CONSTRAINT))
    private Set<OrderGraphItem> orderGraphItemList;

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", referencedColumnName = "id", foreignKey = @ForeignKey(NO_CONSTRAINT))
    private Set<OrderGraphItem2> orderGraphItemList2;
}

public interface OrderGraphRepository extends JpaRepository<OrderGraph1, Long> {
    @EntityGraph(value = "searchOrderGraphItem", type = EntityGraph.EntityGraphType.FETCH)
    OrderGraph1 findByIdEquals(Long id);
}
```

```java
@Test
public void findById() {
    final OrderGraph1 orderGraph1s = orderGraphService.findById(1L);
    assertThat(orderGraph1s, notNullValue());
}
```

`@EntityGraph` 中指定的的 `type` 可以取值 `FETCH`与 `LOAD`

-   FETCH 对于 `NamedEntityGraph` 定义的 `attributeNodes` 使用 eager，未声明的使用 lazy

```java
@EntityGraph(value = "searchOrderGraphItem", type = EntityGraph.EntityGraphType.FETCH)
OrderGraph1 findByIdEquals(Long id);
```

只会查询出 OrderGraph1 对应表中的字段和 orderGraphItemList。orderGraphItemList2 当用的时候才会查询。

-   LOAD 对于 `NamedEntityGraph` 定义的 `attributeNodes ` 使用 eager，未声明的属性使用属性配置的 `FetchType`

```java
@EntityGraph(value = "searchOrderGraphItem", type = EntityGraph.EntityGraphType.LOAD)
OrderGraph1 findByIdEquals(Long id);
```

这个会查询出 OrderGraph1 对应表中的字段和 orderGraphItemList。orderGraphItemList2 属性由于配置的是 `FetchType.EAGER` ,也会直接查出来。

orderGraphItemList2 属性如果配置的是 `FetchType.Lazy` ,orderGraphItemList2 使用的时候才会被查出来

### 审计功能

一般表中都会有，主键 id ,创建时间 ，更新事件，谁创建，谁更新，再加上乐观锁。

实现 `AuditorAware`，填充用户 id。

```java
@Data
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    private Long id;

    /**
     * 创建时间
     */
    @CreatedDate
    @Column(name = "create_date", updatable = false)
    private Instant createDate;
    /**
     * 修改时间
     */
    @LastModifiedDate
    @Column(name = "update_date")
    private Instant updateDate;

    /**
     * 被谁创建
     */
    @CreatedBy
    @Column(name = "create_by", updatable = false)
    private Integer createBy;

    /**
     * 被谁修改
     */
    @LastModifiedBy
    @Column(name = "update_by")
    private Integer updateBy;

    /**
     * 乐观锁
     */
    @Version
    @Column(name = "version")
    private Long version = 0L;
}

@Component
public class MyAuditorAware implements AuditorAware<Integer> {

    /**
     * 获取当前登录的 id
     */
    @Override
    public Optional<Integer> getCurrentAuditor() {
        // 在请求头获取登录标识,再查询用户主键 id
        return Optional.ofNullable(100);
    }

}
```

乐观锁，更新的 version 必须等于数据库中的版本，否则更新会抛出异常。也可以使用 `Spring-retry` 捕获 `ObjectOptimisticLockingFailureException` 重试更新。

```java
@Data
@Entity
@Table(name = "sys_user")
public class SysUserEntity extends BaseEntity {

    private String nickname;

    private Integer age;
}
```

```java
@SpringBootTest
class JpaStudyApplicationTests {

    private static final Long USER_ID_EQUALS_1 = 1L;
    private static final Long USER_ID_EQUALS_2 = 2L;
    private static final Long USER_ID_EQUALS_3 = 3L;

    @Resource
    private SysUserRepository sysUserRepository;

    private SysUserEntity saveSysUserEntity;

    private SysUserEntity saveSysUserEntity2;

    private SysUserEntity saveSysUserEntity3;


    @BeforeEach
    public void beforeEach() {
        saveSysUserEntity = new SysUserEntity();
        saveSysUserEntity.setAge(10);
        saveSysUserEntity.setId(USER_ID_EQUALS_1);
        saveSysUserEntity.setNickname("测试");
        saveSysUserEntity.setVersion(10L);


        saveSysUserEntity2 = new SysUserEntity();
        saveSysUserEntity2.setAge(10);
        saveSysUserEntity2.setId(USER_ID_EQUALS_2);
        saveSysUserEntity2.setNickname("测试");
        saveSysUserEntity2.setVersion(10L);

        saveSysUserEntity3 = new SysUserEntity();
        saveSysUserEntity3.setAge(10);
        saveSysUserEntity3.setId(USER_ID_EQUALS_3);
        saveSysUserEntity3.setNickname("测试");
        saveSysUserEntity3.setVersion(10L);
    }

    @Test
    public void should_update_error() {
        sysUserRepository.save(saveSysUserEntity);

        final Optional<SysUserEntity> byId = sysUserRepository.findById(USER_ID_EQUALS_1);
        assertThat(byId.isPresent(), is(Boolean.TRUE));
        final SysUserEntity sysUserEntity = byId.get();
        // 设置版本 2 也报错
//        sysUserEntity.setVersion(2L);
        sysUserEntity.setVersion(12L);
        sysUserEntity.setNickname("乐观锁更新" + LocalDateTime.now().toString());
        final Executable executable = () -> sysUserRepository.save(sysUserEntity);
        assertThrows(ObjectOptimisticLockingFailureException.class, executable);
    }

    @Test
    public void should_update_success() {
        sysUserRepository.save(saveSysUserEntity2);

        Optional<SysUserEntity> byId = sysUserRepository.findById(USER_ID_EQUALS_2);
        assertThat(byId.isPresent(), is(Boolean.TRUE));
        SysUserEntity sysUserEntity = new SysUserEntity();
        sysUserEntity.setId(USER_ID_EQUALS_2);
        sysUserEntity.setVersion(10L);
        sysUserEntity.setNickname("乐观锁更新" + LocalDateTime.now().toString());
        SysUserEntity save = sysUserRepository.save(sysUserEntity);
        assertThat(save.getVersion(), is(11L));
    }

}
```
